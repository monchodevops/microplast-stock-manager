/**
 * Custom error classes for better error handling and debugging
 */
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(required: number, available: number, material: string) {
    super(
      `Insufficient stock for ${material}. Required: ${required}kg, Available: ${available}kg`,
      'INSUFFICIENT_STOCK'
    );
    this.name = 'InsufficientStockError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class LoggingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoggingError';
  }
}