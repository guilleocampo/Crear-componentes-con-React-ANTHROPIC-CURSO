import { test, expect, vi, beforeEach } from "vitest";

// server-only lanza un error en entornos no-server; lo neutralizamos
vi.mock("server-only", () => ({}));

// Cookie store controlable para verificar las llamadas de createSession
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Importar después de los mocks para que el módulo los recoja
import { SignJWT } from "jose";
import { createSession, getSession } from "../auth";

// Mismo secreto que usa auth.ts cuando JWT_SECRET no está definido
const TEST_SECRET = new TextEncoder().encode("development-secret-key");

async function signToken(payload: object, expiresIn = "7d"): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(TEST_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [cookieName] = mockCookieStore.set.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("createSession stores a JWT string with three segments", async () => {
  await createSession("user-1", "test@example.com");

  const token = mockCookieStore.set.mock.calls[0][1] as string;
  expect(typeof token).toBe("string");
  expect(token.split(".")).toHaveLength(3);
});

test("createSession sets httpOnly, path and sameSite options", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.path).toBe("/");
  expect(options.sameSite).toBe("lax");
});

// --- getSession ---

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await signToken({ userId: "u", email: "e@e.com" }, "-1s");
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await signToken({ userId: "user-1", email: "test@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("test@example.com");
});

// --- createSession ---

test("createSession sets expiry approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});
