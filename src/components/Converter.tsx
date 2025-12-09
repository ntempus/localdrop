'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, AlertCircle, XCircle } from 'lucide-react'
import DropZone from './DropZone'
import { validateFile, convertFile, checkBrowserCompatibility } from '@/lib/converters'
import { ERROR_MESSAGES } from '@/lib/constants'
import type { ConverterState, Status } from '@/lib/types'

/**
 * Converter container component with state management
 * 
 * Orchestrates the conversion flow, validates files, manages state,
 * and ensures proper memory cleanup. Integrates with DropZone for
 * file input and heic2any conversion engine.
 * 
 * Optimized with useCallback and useMemo to minimize re-renders.
 */
export default function Converter() {
  // Initial state matching ConverterState interface
  const [state, setState] = useState<ConverterState>({
    file: null,
    status: 'idle',
    errorMessage: '',
    downloadUrl: '',
    filename: '',
  })

  /**
   * Process file conversion from HEIC to JPEG
   * 
   * Converts the file using heic2any library, creates blob URL,
   * and updates state with the converted file information.
   * 
   * @param file - The validated HEIC file to convert
   */
  const processFile = useCallback(async (file: File) => {
    console.log('[Converter.processFile] 🎯 Starting file processing for:', file.name);
    
    try {
      // Convert file using heic2any (dynamic import for SSR safety)
      console.log('[Converter.processFile] Calling convertFile...');
      const result = await convertFile(file)

      console.log('[Converter.processFile] convertFile returned:', {
        success: result.success,
        hasBlob: !!result.blob,
        error: result.error,
        blobSize: result.blob?.size,
        blobType: result.blob?.type,
      });

      if (!result.success || !result.blob) {
        // Conversion failed - set error state
        console.error('[Converter.processFile] ❌ Conversion failed:', {
          success: result.success,
          hasBlob: !!result.blob,
          error: result.error,
        });
        
        setState({
          file: null,
          status: 'error',
          errorMessage: result.error || 'Conversion failed',
          downloadUrl: '',
          filename: '',
        })
        return
      }

      // Conversion successful - create blob URL and generate filename
      console.log('[Converter.processFile] ✅ Creating blob URL...');
      const blobUrl = URL.createObjectURL(result.blob)
      console.log('[Converter.processFile] Blob URL created:', blobUrl);
      
      // Generate filename by replacing .heic/.HEIC extension with .jpg (Requirement 3.2)
      const originalName = file.name
      const filename = originalName.replace(/\.(heic|HEIC)$/i, '.jpg')
      console.log('[Converter.processFile] Generated filename:', filename);

      // Update state with success status, download URL, and filename
      setState({
        file,
        status: 'success',
        errorMessage: '',
        downloadUrl: blobUrl,
        filename,
      })
      
      console.log('[Converter.processFile] ✅ State updated with success\n');
    } catch (error) {
      // Handle unexpected errors during conversion
      console.error('[Converter.processFile] ❌ Unexpected error in processFile:');
      console.error('[Converter.processFile] Error type:', typeof error);
      console.error('[Converter.processFile] Error object:', error);
      
      if (error instanceof Error) {
        console.error('[Converter.processFile] Error.name:', error.name);
        console.error('[Converter.processFile] Error.message:', error.message);
        console.error('[Converter.processFile] Error.stack:', error.stack);
      }
      
      setState({
        file: null,
        status: 'error',
        errorMessage: 'An unexpected error occurred during conversion',
        downloadUrl: '',
        filename: '',
      })
    }
  }, [])

  /**
   * Handle file selection from DropZone
   * 
   * Validates the file and updates state accordingly.
   * If validation fails, sets error state.
   * If validation passes, sets processing state and triggers conversion.
   * 
   * @param file - The file selected by the user
   */
  const handleFileSelect = useCallback(async (file: File) => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   NEW FILE SELECTED                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('[Converter.handleFileSelect] 📂 File selected:', {
      name: file.name,
      size: `${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      type: file.type || '(no MIME type)',
      lastModified: new Date(file.lastModified).toISOString(),
    });
    
    // Validate file before processing
    console.log('[Converter.handleFileSelect] 🔍 Validating file...');
    const validation = validateFile(file)

    console.log('[Converter.handleFileSelect] Validation result:', {
      isValid: validation.isValid,
      errorMessage: validation.errorMessage || '(none)',
    });

    if (!validation.isValid) {
      // Set error state with validation error message
      console.error('[Converter.handleFileSelect] ❌ Validation failed:', validation.errorMessage);
      setState({
        file: null,
        status: 'error',
        errorMessage: validation.errorMessage,
        downloadUrl: '',
        filename: '',
      })
      return
    }

    // File is valid - set processing state and start conversion
    console.log('[Converter.handleFileSelect] ✅ Validation passed, starting conversion...');
    setState({
      file,
      status: 'processing',
      errorMessage: '',
      downloadUrl: '',
      filename: '',
    })

    // Trigger conversion process
    await processFile(file)
  }, [processFile])

  /**
   * Handle download of converted file
   * 
   * Creates a temporary anchor element to trigger download,
   * then immediately revokes the blob URL to free memory (Requirement 1.5).
   * Updates state to clear downloadUrl after revocation.
   */
  const handleDownload = useCallback(() => {
    if (!state.downloadUrl || !state.filename) {
      return
    }

    // Create temporary anchor element for download
    const link = document.createElement('a')
    link.href = state.downloadUrl
    link.download = state.filename
    link.style.display = 'none'
    
    // Append to body, click, then remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Immediately revoke blob URL to free memory (Requirement 1.5)
    URL.revokeObjectURL(state.downloadUrl)

    // Update state to clear downloadUrl while keeping success status
    setState(prevState => ({
      ...prevState,
      downloadUrl: '',
    }))
  }, [state.downloadUrl, state.filename])

  /**
   * Reset converter state and clean up blob URLs
   * 
   * Revokes any existing blob URLs to prevent memory leaks,
   * then resets all state to initial values.
   */
  const reset = useCallback(() => {
    // Revoke blob URL if it exists
    if (state.downloadUrl) {
      URL.revokeObjectURL(state.downloadUrl)
    }

    // Reset to initial state
    setState({
      file: null,
      status: 'idle',
      errorMessage: '',
      downloadUrl: '',
      filename: '',
    })
  }, [state.downloadUrl])

  /**
   * Browser compatibility check on component mount
   * 
   * Checks for required Web APIs (Blob, Canvas, File, URL.createObjectURL)
   * and sets error state if browser is incompatible.
   * Requirement 4.3: Display browser compatibility error if APIs are missing
   */
  useEffect(() => {
    const compatibility = checkBrowserCompatibility()
    if (!compatibility.isCompatible) {
      setState({
        file: null,
        status: 'error',
        errorMessage: ERROR_MESSAGES.BROWSER_UNSUPPORTED,
        downloadUrl: '',
        filename: '',
      })
    }
  }, [])

  /**
   * Cleanup effect for blob URL memory management
   * 
   * Revokes blob URLs when:
   * - Component unmounts
   * - downloadUrl changes (new conversion or reset)
   * 
   * This ensures no memory leaks from orphaned blob URLs.
   */
  useEffect(() => {
    // Cleanup function to revoke blob URL
    return () => {
      if (state.downloadUrl) {
        URL.revokeObjectURL(state.downloadUrl)
      }
    }
  }, [state.downloadUrl])

  // Memoize disabled state to prevent unnecessary recalculations
  // Disabled during processing to prevent multiple simultaneous conversions (Requirement 3.5, 4.5)
  // Also disabled if browser is incompatible
  const isDisabled = useMemo(() => 
    state.status === 'processing' || 
    (state.status === 'error' && state.errorMessage === ERROR_MESSAGES.BROWSER_UNSUPPORTED),
    [state.status, state.errorMessage]
  )

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* DropZone component with state-driven props */}
      <DropZone
        onFileSelect={handleFileSelect}
        disabled={isDisabled}
        status={state.status}
      />

      {/* Enhanced error message display with visual indicators */}
      {state.status === 'error' && state.errorMessage && (
        <div className="mt-4 p-4 sm:p-5 bg-surface-dark border-2 border-red-500/30 rounded-xl shadow-sm transition-all duration-200 ease-out">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Error icon */}
            <div className="flex-shrink-0 mt-0.5">
              {state.errorMessage === ERROR_MESSAGES.BROWSER_UNSUPPORTED ? (
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" aria-hidden="true" />
              )}
            </div>
            
            {/* Error content */}
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm sm:text-base text-text-primary-dark font-semibold leading-relaxed">
                {state.errorMessage}
              </p>
              
              {/* Browser compatibility error - no recovery option */}
              {state.errorMessage === ERROR_MESSAGES.BROWSER_UNSUPPORTED ? (
                <p className="text-xs sm:text-sm text-text-secondary-dark leading-relaxed">
                  Please update your browser to use LocalDrop. We recommend Chrome, Firefox, Safari, or Edge.
                </p>
              ) : (
                /* Other errors - show recovery button */
                <button
                  onClick={reset}
                  className="mt-2 w-full sm:w-auto px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-150 min-h-[44px] flex items-center justify-center shadow-sm hover:shadow-md active:scale-[0.98]"
                  type="button"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success state with download functionality (Requirement 3.4) */}
      {state.status === 'success' && (
        <div className="mt-4 p-4 sm:p-5 bg-surface-dark border-2 border-primary/30 rounded-xl shadow-sm space-y-3 sm:space-y-4 transition-all duration-200 ease-out">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-background-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm sm:text-base text-text-primary-dark font-semibold mb-1">
                Conversion complete!
              </p>
              <p className="text-xs sm:text-sm text-text-secondary-dark">
                Your file is ready to download.
              </p>
            </div>
          </div>
          
          {/* Prominent Download JPG button (Requirement 3.4, 5.3) */}
          {state.downloadUrl && (
            <button
              onClick={handleDownload}
              className="w-full px-6 py-3.5 bg-primary hover:bg-primary-hover active:bg-primary/90 text-background-dark font-semibold text-base rounded-lg transition-all duration-150 min-h-[44px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download JPG
            </button>
          )}
          
          {/* Convert another file button */}
          <button
            onClick={reset}
            className="w-full text-sm sm:text-base text-text-secondary-dark hover:text-text-primary-dark font-medium py-2.5 min-h-[44px] flex items-center justify-center transition-colors duration-150"
            type="button"
          >
            Convert another file
          </button>
        </div>
      )}

      {/* Processing state feedback with spinner (Requirement 4.1) */}
      {state.status === 'processing' && (
        <div className="mt-4 p-4 sm:p-5 bg-surface-dark border-2 border-border-dark rounded-xl shadow-sm transition-all duration-200 ease-out">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" aria-hidden="true" />
            <p className="text-sm sm:text-base text-text-primary-dark font-semibold">
              Processing your file...
            </p>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary-dark text-center mt-3">
            This may take a few moments depending on file size
          </p>
        </div>
      )}
    </div>
  )
}

