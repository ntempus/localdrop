/**
 * Conversion utilities for LocalDrop converter
 * 
 * This module contains file validation and conversion-related functions
 * that handle HEIC file processing in a privacy-first, client-side manner.
 */

import { FILE_CONSTRAINTS, ERROR_MESSAGES, CONVERSION_CONFIG } from './constants';
import type { FileValidationResult, OutputFormat } from './types';

/**
 * Validates a file before conversion processing
 * 
 * Checks file extension and size according to FILE_CONSTRAINTS.
 * Returns validation result with specific error messages for failures.
 * 
 * Validation order:
 * 1. Extension check (must be .heic or .HEIC)
 * 2. Size check (must be <= 50MB)
 * 
 * @param file - The file to validate
 * @returns FileValidationResult with isValid flag and errorMessage
 * 
 * @example
 * const result = validateFile(file);
 * if (!result.isValid) {
 *   console.error(result.errorMessage);
 * }
 */
export function validateFile(file: File): FileValidationResult {
  // Check file extension first (requirement 4.4: validate extension before conversion)
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_CONSTRAINTS.allowedExtensions.some(
    ext => fileName.endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.INVALID_FORMAT,
    };
  }

  // Check file size (requirement 2.4: reject files > 50MB)
  if (file.size > FILE_CONSTRAINTS.maxSize) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.FILE_TOO_LARGE,
    };
  }

  // File passed all validation checks
  return {
    isValid: true,
    errorMessage: '',
  };
}

/**
 * Browser compatibility check result interface
 */
export interface BrowserCompatibilityResult {
  isCompatible: boolean;
  missingAPIs: string[];
}

/**
 * Checks browser compatibility for required Web APIs
 * 
 * Validates that the browser supports all required APIs for HEIC conversion:
 * - Blob API (for file handling)
 * - Canvas API (for image processing in heic2any)
 * - File API (for file input)
 * - URL.createObjectURL (for blob URL creation)
 * 
 * Requirement 4.3: Display "Your browser is too old for privacy-mode" if incompatible
 * 
 * @returns BrowserCompatibilityResult with compatibility status and missing APIs
 * 
 * @example
 * const compat = checkBrowserCompatibility();
 * if (!compat.isCompatible) {
 *   console.error('Missing APIs:', compat.missingAPIs);
 * }
 */
export function checkBrowserCompatibility(): BrowserCompatibilityResult {
  const missingAPIs: string[] = [];

  // Check for Blob API
  if (typeof Blob === 'undefined') {
    missingAPIs.push('Blob');
  }

  // Check for Canvas API
  if (typeof HTMLCanvasElement === 'undefined') {
    missingAPIs.push('Canvas');
  }

  // Check for File API
  if (typeof File === 'undefined') {
    missingAPIs.push('File');
  }

  // Check for URL.createObjectURL
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    missingAPIs.push('URL.createObjectURL');
  }

  return {
    isCompatible: missingAPIs.length === 0,
    missingAPIs,
  };
}

/**
 * Conversion result interface for convertFile function
 */
export interface ConversionResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/**
 * Validates if a file is actually a HEIC/HEIF file by checking its magic bytes
 * 
 * HEIC/HEIF files are based on the ISO Base Media File Format (ISOBMFF)
 * and should have specific magic bytes in their header.
 * 
 * @param file - The file to validate
 * @returns Promise<boolean> true if file appears to be a valid HEIC/HEIF file
 */
async function isValidHeicFile(file: File): Promise<boolean> {
  try {
    // Read the first 12 bytes of the file
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for ftyp box at offset 4 (HEIC/HEIF files are ISO Base Media Format)
    // Bytes 4-7 should be "ftyp"
    const ftypSignature = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);

    if (ftypSignature !== 'ftyp') {
      console.warn('[isValidHeicFile] ❌ File does not have ftyp signature at offset 4. Found:', ftypSignature);
      return false;
    }

    // Check for HEIC/HEIF brand identifiers at offset 8-11
    // Common brands: heic, heix, hevc, hevx, heim, heis, hevm, hevs, mif1, msf1
    const brandSignature = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    const validBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];

    return validBrands.includes(brandSignature);
  } catch (error) {
    console.error('[isValidHeicFile] ❌ Error validating HEIC file structure:', error);
    console.error('[isValidHeicFile] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Converts a HEIC file to JPEG format using heic2any library
 * 
 * Uses dynamic import to ensure SSR safety in Next.js 15 App Router.
 * The conversion is performed entirely client-side with no network requests.
 * 
 * Configuration:
 * - Output format: JPEG (image/jpeg) or PNG (image/png)
 * - Quality: 0.8 (80%) for optimal speed-quality balance
 * 
 * @param file - The HEIC file to convert
 * @param outputFormat - The desired output format (default: image/jpeg)
 * @returns Promise<ConversionResult> with success flag, blob, or error message
 * 
 * @example
 * const result = await convertFile(file);
 * if (result.success && result.blob) {
 *   const url = URL.createObjectURL(result.blob);
 *   // Use the blob URL for download
 * }
 */
export async function convertFile(file: File, outputFormat: OutputFormat = CONVERSION_CONFIG.toType as OutputFormat): Promise<ConversionResult> {
  try {
    // Validate file structure before attempting conversion
    const isValid = await isValidHeicFile(file);

    if (!isValid) {
      console.error('[convertFile] File does not appear to be a valid HEIC/HEIF file');
      return {
        success: false,
        error: ERROR_MESSAGES.CONVERSION_FAILED,
      };
    }

    // Dynamic import for SSR safety (Next.js 15 App Router requirement)
    // This ensures heic2any is only loaded on the client side
    // Using a more robust import strategy with error handling and retry logic

    let heic2anyModule;
    let heic2any;

    try {
      // Try standard dynamic import first
      heic2anyModule = await import('heic2any');
      heic2any = heic2anyModule.default || heic2anyModule;

    } catch (importError) {
      // Try alternative import path
      try {
        heic2anyModule = await import('heic2any/dist/heic2any.js');
        heic2any = heic2anyModule.default || heic2anyModule;
      } catch (retryError) {
        console.error('[convertFile] ❌ Alternative import also failed:', retryError);
        throw new Error(`Failed to load heic2any library: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
    }

    // Ensure heic2any is a function
    if (typeof heic2any !== 'function') {
      console.error('[convertFile] ❌ heic2any is not a function:', {
        type: typeof heic2any,
        value: heic2any,
        moduleKeys: Object.keys(heic2anyModule),
      });
      throw new Error('heic2any library loaded but is not a function');
    }

    // Read file as ArrayBuffer first to ensure we have clean data
    // This fixes "ERR_LIBHEIF Heic doesn't contain valid images" by ensuring
    // we pass a proper Blob with the correct MIME type to heic2any
    const arrayBuffer = await file.arrayBuffer();
    const blobWithCorrectType = new Blob([arrayBuffer], {
      type: 'image/heic'
    });



    // Convert HEIC to JPEG using CONVERSION_CONFIG
    // heic2any may return a Blob or array of Blobs (for multi-image HEIC files)
    // We use the first result if it's an array
    const result = await heic2any({
      blob: blobWithCorrectType,
      toType: outputFormat,
      quality: CONVERSION_CONFIG.quality,
    });



    // Handle result - heic2any returns Blob or Blob[]
    const convertedBlob = Array.isArray(result) ? result[0] : result;

    if (!convertedBlob || !((convertedBlob as any) instanceof Blob)) {
      console.error('[convertFile] Invalid conversion result');
      return {
        success: false,
        error: ERROR_MESSAGES.CONVERSION_FAILED,
      };
    }

    return {
      success: true,
      blob: convertedBlob,
    };
  } catch (error: unknown) {
    // Catch any conversion errors and return user-friendly message
    // Requirement 4.2: Display "This file appears to be damaged or not a standard HEIC"

    // Use ultra-safe logging - convert everything to strings first
    const safeLog = (label: string, value: unknown) => {
      try {
        let safeValue: string;
        if (value === null) {
          safeValue = 'null';
        } else if (value === undefined) {
          safeValue = 'undefined';
        } else if (typeof value === 'string') {
          safeValue = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          safeValue = String(value);
        } else if (value instanceof Error) {
          safeValue = `${value.name}: ${value.message}`;
        } else {
          try {
            safeValue = JSON.stringify(value);
          } catch {
            safeValue = String(value);
          }
        }
        console.error(`[convertFile] ${label}:`, safeValue);
      } catch {
        // Silently fail if logging fails
      }
    };

    // Log error information safely
    safeLog('Conversion failed', error);

    if (error instanceof Error) {
      safeLog('Error name', error.name);
      safeLog('Error message', error.message);
      if (error.stack) {
        safeLog('Stack trace', error.stack);
      }
    } else if (error && typeof error === 'object') {
      try {
        const errorObj = error as Record<string, unknown>;
        if ('code' in errorObj) {
          safeLog('HEIC2ANY error code', errorObj.code);
        }
        if ('message' in errorObj) {
          safeLog('HEIC2ANY error message', errorObj.message);
        }
        if ('name' in errorObj) {
          safeLog('Error name', errorObj.name);
        }
      } catch {
        // Ignore property access errors
      }
    } else {
      safeLog('Error value', error);
    }

    return {
      success: false,
      error: ERROR_MESSAGES.CONVERSION_FAILED,
    };
  }
}

