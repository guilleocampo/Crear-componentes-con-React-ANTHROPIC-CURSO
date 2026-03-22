import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeTool(
  toolName: string,
  args: Record<string, string>,
  done = false
): ToolInvocation {
  if (done) {
    return { toolCallId: "id", toolName, args, state: "result", result: "ok" };
  }
  return { toolCallId: "id", toolName, args, state: "call" };
}

// --- str_replace_editor ---

test("str_replace_editor create — pending shows 'Creating App.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "create", path: "App.jsx" })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor create — done shows 'Created App.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "create", path: "App.jsx" }, true)}
    />
  );
  expect(screen.getByText("Created App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace — pending shows 'Editing Counter.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "str_replace", path: "Counter.jsx" })}
    />
  );
  expect(screen.getByText("Editing Counter.jsx")).toBeDefined();
});

test("str_replace_editor str_replace — done shows 'Edited Counter.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "str_replace", path: "Counter.jsx" }, true)}
    />
  );
  expect(screen.getByText("Edited Counter.jsx")).toBeDefined();
});

test("str_replace_editor insert — pending shows 'Editing Card.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "insert", path: "Card.jsx" })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert — done shows 'Edited Card.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "insert", path: "Card.jsx" }, true)}
    />
  );
  expect(screen.getByText("Edited Card.jsx")).toBeDefined();
});

test("str_replace_editor view — done shows 'Viewed App.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "view", path: "App.jsx" }, true)}
    />
  );
  expect(screen.getByText("Viewed App.jsx")).toBeDefined();
});

test("str_replace_editor undo_edit — done shows 'Undid App.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "undo_edit", path: "App.jsx" }, true)}
    />
  );
  expect(screen.getByText("Undid App.jsx")).toBeDefined();
});

// --- file_manager ---

test("file_manager rename — pending shows 'Renaming Button.jsx → PrimaryButton.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("file_manager", {
        command: "rename",
        path: "Button.jsx",
        new_path: "PrimaryButton.jsx",
      })}
    />
  );
  expect(screen.getByText("Renaming Button.jsx → PrimaryButton.jsx")).toBeDefined();
});

test("file_manager rename — done shows 'Renamed Button.jsx → PrimaryButton.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool(
        "file_manager",
        { command: "rename", path: "Button.jsx", new_path: "PrimaryButton.jsx" },
        true
      )}
    />
  );
  expect(screen.getByText("Renamed Button.jsx → PrimaryButton.jsx")).toBeDefined();
});

test("file_manager delete — pending shows 'Deleting Card.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("file_manager", { command: "delete", path: "Card.jsx" })}
    />
  );
  expect(screen.getByText("Deleting Card.jsx")).toBeDefined();
});

test("file_manager delete — done shows 'Deleted Card.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("file_manager", { command: "delete", path: "Card.jsx" }, true)}
    />
  );
  expect(screen.getByText("Deleted Card.jsx")).toBeDefined();
});

// --- Edge cases ---

test("nested path extracts basename — 'Creating Counter.jsx'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", {
        command: "create",
        path: "/components/Counter.jsx",
      })}
    />
  );
  expect(screen.getByText("Creating Counter.jsx")).toBeDefined();
});

test("unknown tool falls back to tool name", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("unknown_tool", {})}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("pending state shows spinner", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "create", path: "App.jsx" })}
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
});

test("done state shows green dot", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeTool("str_replace_editor", { command: "create", path: "App.jsx" }, true)}
    />
  );
  expect(screen.getByTestId("done-dot")).toBeDefined();
});
