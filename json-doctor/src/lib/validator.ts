export function validateJson(input: string) {
  try {
    JSON.parse(input);

    return {
      valid: true,
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid JSON",
    };
  }
}