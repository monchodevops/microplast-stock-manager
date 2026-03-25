/**
 * Result pattern for handling operations that can succeed or fail
 * Eliminates the need for try-catch everywhere and makes error handling explicit
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export namespace Result {
  export function success<T>(data: T): Result<T, never> {
    return { success: true, data };
  }

  export function failure<E>(error: E): Result<never, E> {
    return { success: false, error };
  }

  export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
  }

  export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
  }
}

/**
 * Validation result for business rules validation
 */
export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly error?: string
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true);
  }

  static failure(error: string): ValidationResult {
    return new ValidationResult(false, error);
  }
}

/**
 * Simple operation result for component feedback
 */
export interface OperationResult {
  success: boolean;
  message: string;
}