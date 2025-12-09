/**
 * Core constants for LocalDrop converter
 * 
 * These constants define file constraints, conversion configuration,
 * error messages, and UI state mappings used throughout the application.
 */

/**
 * File constraints for validation
 * - Maximum file size: 50MB (to prevent browser crashes)
 * - Allowed extensions: .heic and .HEIC
 */
export const FILE_CONSTRAINTS = {
  maxSize: 50 * 1024 * 1024, // 50MB in bytes
  allowedExtensions: ['.heic', '.HEIC'],
} as const;

/**
 * Conversion configuration for heic2any library
 * - Output format: JPEG
 * - Quality: 0.8 (80%) for optimal speed-quality balance
 */
export const CONVERSION_CONFIG = {
  toType: 'image/jpeg' as const,
  quality: 0.8,
} as const;

/**
 * Error messages for user feedback
 * Matches requirements from requirements.md (Requirement 4.2, 4.3)
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File too large for browser processing. Please select a file under 50MB.',
  INVALID_FORMAT: 'Please select a HEIC file. Only .heic and .HEIC files are supported.',
  CONVERSION_FAILED: 'This file appears to be damaged or not a standard HEIC. Try taking a new photo or exporting the image again from your device.',
  BROWSER_UNSUPPORTED: 'Your browser is too old for privacy-mode. Please update to the latest version of Chrome, Firefox, Safari, or Edge.',
} as const;

/**
 * Error type derived from ERROR_MESSAGES keys
 * Used for type-safe error handling
 */
export type ErrorType = keyof typeof ERROR_MESSAGES;

/**
 * UI state mappings for Tailwind CSS classes
 * Provides visual feedback for different converter states
 * Uses slate colors for consistency with design system
 */
export const UI_STATES = {
  idle: 'border-dashed border-slate-300 bg-slate-50',
  dragging: 'border-solid border-blue-500 bg-blue-50',
  processing: 'border-slate-300 bg-slate-100 cursor-not-allowed',
  success: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
} as const;

