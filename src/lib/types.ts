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

export type OutputFormat = 'image/jpeg' | 'image/png';

/**
 * Converter state interface for React state management
 * Tracks the current file, conversion status, errors, and download URL
 */
export interface FileItem {
  id: string;
  file: File;
  status: Status;
  errorMessage: string;
  downloadUrl: string;
  filename: string;
}

/**
 * Converter state interface for React state management
 * Tracks the list of files and their individual states
 */
export interface ConverterState {
  files: FileItem[];
  globalError?: string;
  selectedFormat: OutputFormat;
}

/**
 * Props interface for DropZone component
 */
export interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
  status: Status; // Kept for general UI status if needed, or we might derive it
}

/**
 * Result interface for file validation
 * Returned by validateFile function to indicate validation status
 */
export interface FileValidationResult {
  isValid: boolean;
  errorMessage: string;
}

