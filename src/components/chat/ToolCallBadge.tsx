// ToolCallBadge renders a human-readable chip for an AI tool call.
// Shows a spinner while pending, a green dot when complete.
// Derives a friendly label (e.g. "Creating App.jsx") from the tool name + args.

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function basename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

/** Derives a human-readable label from a tool invocation. */
export function getLabel(tool: ToolInvocation, isDone: boolean): string {
  const args = (tool.args ?? {}) as Record<string, string>;

  if (tool.toolName === "str_replace_editor") {
    const file = basename(args.path ?? "");
    switch (args.command) {
      case "create":
        return isDone ? `Created ${file}` : `Creating ${file}`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited ${file}` : `Editing ${file}`;
      case "view":
        return isDone ? `Viewed ${file}` : `Viewing ${file}`;
      case "undo_edit":
        return isDone ? `Undid ${file}` : `Undoing ${file}`;
    }
  }

  if (tool.toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const from = basename(args.path ?? "");
        const to = basename(args.new_path ?? "");
        return isDone ? `Renamed ${from} → ${to}` : `Renaming ${from} → ${to}`;
      }
      case "delete": {
        const file = basename(args.path ?? "");
        return isDone ? `Deleted ${file}` : `Deleting ${file}`;
      }
    }
  }

  return tool.toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

/** Inline badge that shows what an AI tool call is doing. */
export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const isDone =
    toolInvocation.state === "result" && !!toolInvocation.result;
  const label = getLabel(toolInvocation, isDone);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        // Green dot indicates the tool call completed successfully
        <div className="w-2 h-2 rounded-full bg-emerald-500" data-testid="done-dot" />
      ) : (
        // Spinner indicates the tool call is still in progress
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="spinner" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
