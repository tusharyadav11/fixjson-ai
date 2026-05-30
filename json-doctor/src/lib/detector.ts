import type { JsonIssue } from "@/src/types/json";

export function detectIssues(input: string): JsonIssue[] {
  const issues: JsonIssue[] = [];

  if (/'/.test(input)) {
    issues.push({
      type: "single_quotes",
      message: "Single quotes detected",
      severity: "warning",
    });
  }

  if (/,(\s*[}\]])/.test(input)) {
    issues.push({
      type: "trailing_comma",
      message: "Trailing comma detected",
      severity: "warning",
    });
  }

  if (/{\s*[a-zA-Z0-9_]+\s*:/.test(input)) {
    issues.push({
      type: "unquoted_keys",
      message: "Property keys missing quotes",
      severity: "warning",
    });
  }

  return issues;
}
