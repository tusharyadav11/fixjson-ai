import { detectIssues } from "./detector";
import { validateJson } from "./validator";
import type { FixResult } from "@/src/types/json";

export function fixJson(input: string): FixResult {
  let fixed = input;

  // Replace single quotes
  fixed = fixed.replace(/'/g, '"');

  // Quote unquoted keys
  fixed = fixed.replace(
    /([{,]\s*)([a-zA-Z0-9_]+)\s*:/g,
    '$1"$2":'
  );

  // Remove trailing commas
  fixed = fixed.replace(
    /,\s*([}\]])/g,
    "$1"
  );

  const issues = detectIssues(input);

  const validation = validateJson(fixed);

  if (!validation.valid) {
    return {
      success: false,
      valid: false,
      original: input,
      fixed: "",
      issues: [
        ...issues,
        {
          type: "invalid_json",
          message:
            validation.error ||
            "Unable to automatically repair JSON",
          severity: "error",
        },
      ],
      error:
        validation.error ||
        "Unable to automatically repair JSON",
    };
  }

  return {
    success: true,
    valid: true,
    original: input,
    fixed,
    issues,
    error: null,
  };
}
