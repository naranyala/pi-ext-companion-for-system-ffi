/**
 * Standardized error classes for the extension.
 */
export class ExtensionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "ExtensionError";
  }

  static from(err: any, code: string = "UNKNOWN"): ExtensionError {
    if (err instanceof ExtensionError) return err;
    return new ExtensionError(
      err?.message || String(err),
      code,
      err
    );
  }
}

export class ServiceError extends ExtensionError {
  constructor(service: string, message: string, details?: any) {
    super(`[${service}] ${message}`, "SERVICE_ERROR", details);
    this.name = "ServiceError";
  }
}

export class FFIDetectionError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, "FFI_DETECTION_ERROR", details);
    this.name = "FFIDetectionError";
  }
}

export class WebDocError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, "WEB_DOC_ERROR", details);
    this.name = "WebDocError";
  }
}
