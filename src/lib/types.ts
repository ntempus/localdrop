/**
 * Core TypeScript interfaces and types for LocalDrop converter
 * 
 * These types define the structure for React state management,
 * component props, and error handling throughout the application.
 */

/**
 * Status type for converter state machine
 */
export type Status = 'idle' | 'processing' | 'success' | 'error';

/**
 * Converter state interface for React state management
 * Tracks the current file, conversion status, errors, and download URL
 */
export interface ConverterState {
  file: File | null;
  status: Status;
  errorMessage: string;
  downloadUrl: string;
  filename: string;
}

/**
 * Props interface for DropZone component
 */
export interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  status: Status;
}

/**
 * Result interface for file validation
 * Returned by validateFile function to indicate validation status
 */
export interface FileValidationResult {
  isValid: boolean;
  errorMessage: string;
}

