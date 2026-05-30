export interface JsonIssue {
  type: string;
  message: string;
  severity: "error" | "warning";
}

export interface FixResult {
  success: boolean;
  valid: boolean;
  original: string;
  fixed: string;
  issues: JsonIssue[];
  error: string | null;
}
