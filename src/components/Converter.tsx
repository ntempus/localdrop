'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Loader2, AlertCircle, XCircle, FileIcon, Download, Trash2, CheckCircle2, Clock } from 'lucide-react'
import DropZone from './DropZone'
import { validateFile, convertFile, checkBrowserCompatibility } from '@/lib/converters'
import { ERROR_MESSAGES, CONVERSION_CONFIG, MAX_CONCURRENT_CONVERSIONS } from '@/lib/constants'
import type { ConverterState, FileItem, Status, OutputFormat } from '@/lib/types'

/**
 * Converter container component with state management
 * 
 * Orchestrates the conversion flow for multiple files, validates them,
 * manages state, and ensures proper memory cleanup.
 */
export default function Converter() {
  const [state, setState] = useState<ConverterState>({
    files: [],
    selectedFormat: CONVERSION_CONFIG.toType as OutputFormat
  })
  const [isZipping, setIsZipping] = useState(false)

  // Track all created object URLs to ensure proper cleanup
  const objectUrls = useRef<Set<string>>(new Set())

  // Track conversion times to calculate dynamic average (sliding window)
  const processTimeHistory = useRef<number[]>([])

  /**
   * Process file conversion from HEIC to JPEG
   * 
   * Converts the file using heic2any library, creates blob URL,
   * and updates state with the converted file information.
   * 
   * @param file - The validated HEIC file to convert
   */
  /**
   * Process a single file conversion from HEIC to JPEG
   * 
   * @param fileId - The ID of the file item to process
   */
  const processFileItem = useCallback(async (fileId: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId ? { ...f, status: 'processing' } : f
      )
    }))

    // Get the file object from current state (or we could pass it, but state is safer)
    // We need to access the latest state, so we use the functional update to get the item
    // But we can't access it inside the functional update for the async call.
    // So we find it from the state *before* the update or just pass the file object if we have it?
    // Better to find it in the current state `state.files` but `state` might be stale in closure?
    // Actually, we can get the file from the state variable if `processFileItem` is called after state update.
    // However, to be safe and avoid closure staleness issues, let's look it up from the previous state in the setstate, 
    // OR, better, pass the file object as argument too.

    // Let's refine: We will pass `file` and `id`.
  }, [])

  // Re-implementing processFileItem properly
  const processFile = useCallback(async (fileItem: FileItem, format: OutputFormat) => {
    console.log('[Converter.processFile] 🎯 Starting file processing for:', fileItem.file.name, 'Format:', format);

    const startTime = performance.now()

    try {
      const result = await convertFile(fileItem.file, format)

      // Calculate duration and add to history
      const duration = performance.now() - startTime
      processTimeHistory.current.push(duration)
      // Keep only last 10 samples for better responsiveness
      if (processTimeHistory.current.length > 10) {
        processTimeHistory.current.shift()
      }

      if (!result.success || !result.blob) {
        setState(prev => ({
          ...prev,
          files: prev.files.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'error', errorMessage: result.error || 'Conversion failed' }
              : f
          )
        }))
        return
      }

      const blobUrl = URL.createObjectURL(result.blob)
      objectUrls.current.add(blobUrl)

      const originalName = fileItem.file.name
      const extension = format === 'image/jpeg' ? '.jpg' : '.png'
      const filename = originalName.replace(/\.(heic|HEIC)$/i, extension)

      setState(prev => ({
        ...prev,
        files: prev.files.map(f =>
          f.id === fileItem.id
            ? {
              ...f,
              status: 'success',
              downloadUrl: blobUrl,
              filename
            }
            : f
        )
      }))
    } catch (error) {
      console.error('[Converter.processFile] ❌ Unexpected error:', error);
      setState(prev => ({
        ...prev,
        files: prev.files.map(f =>
          f.id === fileItem.id
            ? { ...f, status: 'error', errorMessage: 'Unexpected error during conversion' }
            : f
        )
      }))
    }
  }, []) // Remove dependency on state to avoid stale closure issues, passed params are sufficient

  /**
   * Handle file selection from DropZone
   */
  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    console.log(`[Converter.handleFileSelect] Selected ${selectedFiles.length} files`);

    const newFileItems: FileItem[] = selectedFiles.map(file => {
      const validation = validateFile(file)
      return {
        id: crypto.randomUUID(),
        file,
        status: validation.isValid ? 'idle' : 'error',
        errorMessage: validation.isValid ? '' : validation.errorMessage,
        downloadUrl: '',
        filename: ''
      }
    })

    // Add new files to state
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...newFileItems]
    }))
  }, []) // Remove processFile dependency as it's no longer called here

  /**
   * Queue Processing Effect
   * 
   * Monitors the file list and processes pending files up to the concurrency limit.
   * This ensures we don't overwhelm the browser with too many parallel conversions.
   */
  useEffect(() => {
    // Count currently processing files
    const processingCount = state.files.filter(f => f.status === 'processing').length

    // If we have room for more
    if (processingCount < MAX_CONCURRENT_CONVERSIONS) {
      // Find idle files
      const availableSlots = MAX_CONCURRENT_CONVERSIONS - processingCount
      const nextFiles = state.files
        .filter(f => f.status === 'idle')
        .slice(0, availableSlots)

      if (nextFiles.length > 0) {
        console.log(`[Queue] Starting ${nextFiles.length} new conversions. Active: ${processingCount}`);

        // 1. Mark them as processing in state
        setState(prev => ({
          ...prev,
          files: prev.files.map(f =>
            nextFiles.some(nf => nf.id === f.id)
              ? { ...f, status: 'processing' }
              : f
          )
        }))

        // 2. Trigger the actual conversion logic
        nextFiles.forEach(file => {
          processFile(file, state.selectedFormat)
        })
      }
    }
  }, [state.files, state.selectedFormat, processFile])

  /**
   * Handle download of converted file
   * 
   * Creates a temporary anchor element to trigger download,
   * then immediately revokes the blob URL to free memory (Requirement 1.5).
   * Updates state to clear downloadUrl after revocation.
   */
  /**
   * Handle download of a specific file
   */
  const handleDownload = useCallback((fileItem: FileItem) => {
    if (!fileItem.downloadUrl || !fileItem.filename) return

    const link = document.createElement('a')
    link.href = fileItem.downloadUrl
    link.download = fileItem.filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  /**
   * Handle download of all completed files as a ZIP archive
   */
  const handleDownloadAll = useCallback(async () => {
    const successfulFiles = state.files.filter(f => f.status === 'success' && f.downloadUrl)
    if (successfulFiles.length === 0) return

    try {
      setIsZipping(true)
      console.log('[handleDownloadAll] Starting ZIP generation for', successfulFiles.length, 'files');

      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Add files to zip
      const processingPromises = successfulFiles.map(async (fileItem) => {
        try {
          // Fetch blob from blob URL
          const response = await fetch(fileItem.downloadUrl)
          const blob = await response.blob()
          zip.file(fileItem.filename, blob)
        } catch (err) {
          console.error('[handleDownloadAll] Failed to add file to zip:', fileItem.filename, err)
        }
      })

      await Promise.all(processingPromises)

      // Generate zip file
      console.log('[handleDownloadAll] Generating ZIP blob...');
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Trigger download
      const zipUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = zipUrl
      link.download = `converted_images_${new Date().getTime()}.zip`
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(zipUrl), 1000)
    } catch (error) {
      console.error('[handleDownloadAll] ZIP generation failed:', error)
      // Optionally show a toast or error state here
    } finally {
      setIsZipping(false)
    }
  }, [state.files])

  /**
   * Remove a file from the list and clean up its resources
   */
  const removeFile = useCallback((id: string) => {
    setState(prev => {
      const fileToRemove = prev.files.find(f => f.id === id)
      if (fileToRemove?.downloadUrl) {
        URL.revokeObjectURL(fileToRemove.downloadUrl)
        objectUrls.current.delete(fileToRemove.downloadUrl)
      }
      return {
        ...prev,
        files: prev.files.filter(f => f.id !== id)
      }
    })
  }, [])

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    // Revoke all URLs
    state.files.forEach(f => {
      if (f.downloadUrl) {
        URL.revokeObjectURL(f.downloadUrl)
        objectUrls.current.delete(f.downloadUrl)
      }
    })
    setState(prev => ({ ...prev, files: [] }))
  }, [state.files])

  /**
   * Reset converter state and clean up blob URLs
   * 
   * Revokes any existing blob URLs to prevent memory leaks,
   * then resets all state to initial values.
   */
  const reset = useCallback(() => {
    // Revoke all URLs
    state.files.forEach(f => {
      if (f.downloadUrl) {
        URL.revokeObjectURL(f.downloadUrl)
        objectUrls.current.delete(f.downloadUrl)
      }
    })
    // Reset to initial state
    setState({
      files: [],
      globalError: undefined,
      selectedFormat: CONVERSION_CONFIG.toType as OutputFormat
    })
  }, [state.files])

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
      setState(prev => ({
        ...prev,
        globalError: ERROR_MESSAGES.BROWSER_UNSUPPORTED
      }))
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
  /**
   * Cleanup effect for blob URL memory management
   * 
   * Revokes all generated blob URLs when the component unmounts.
   * Uses the ref to ensure we catch all URLs regardless of state changes.
   */
  useEffect(() => {
    return () => {
      objectUrls.current.forEach(url => URL.revokeObjectURL(url))
      objectUrls.current.clear()
    }
  }, [])

  // Memoize disabled state to prevent unnecessary recalculations
  // Disabled during processing to prevent multiple simultaneous conversions (Requirement 3.5, 4.5)
  // Also disabled if browser is incompatible
  const isDisabled = useMemo(() =>
    // Disable if browser is unsupported
    !!state.globalError,
    [state.globalError]
  )

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const total = state.files.length
    const processing = state.files.filter(f => f.status === 'processing' || f.status === 'idle').length
    const success = state.files.filter(f => f.status === 'success').length
    const error = state.files.filter(f => f.status === 'error').length
    const remaining = total - success - error

    // Calculate dynamic average processing time
    // If no history, default to null (calculating)
    const averageTimePerFile = processTimeHistory.current.length > 0
      ? processTimeHistory.current.reduce((a, b) => a + b, 0) / processTimeHistory.current.length
      : null

    // Estimate: (Remaining items * Avg Time) / Concurrency
    const estimatedSeconds = (remaining > 0 && averageTimePerFile !== null)
      ? Math.ceil(((remaining * averageTimePerFile) / MAX_CONCURRENT_CONVERSIONS) / 1000)
      : null

    return {
      total,
      processing,
      success,
      error,
      remaining,
      estimatedSeconds
    }
  }, [state.files])

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* DropZone component with state-driven props */}
      <DropZone
        onFileSelect={handleFileSelect}
        disabled={false} // Always allow dropping more files
        status={stats.processing > 0 ? 'processing' : 'idle'}
      />

      {/* Format Selection - Only show if not processing and no global error */}
      {!state.globalError && (
        <div className="flex justify-end px-2">
          <div className="flex items-center gap-3 bg-surface-dark p-1 rounded-lg border border-border-dark inline-flex">
            <span className="text-xs font-medium text-text-secondary-dark pl-2">Format:</span>
            <div className="flex p-1 bg-background-dark/50 rounded-md">
              <button
                onClick={() => setState(prev => ({ ...prev, selectedFormat: 'image/jpeg' }))}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${state.selectedFormat === 'image/jpeg'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-tertiary-dark hover:text-text-primary-dark'
                  }`}
              >
                JPG
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, selectedFormat: 'image/png' }))}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${state.selectedFormat === 'image/png'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-tertiary-dark hover:text-text-primary-dark'
                  }`}
              >
                PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Message (e.g. Browser Unsupported) */}
      {state.globalError && (
        <div className="mt-4 p-4 sm:p-5 bg-surface-dark border-2 border-red-500/30 rounded-xl shadow-sm transition-all duration-200 ease-out">
          <div className="flex items-start gap-3 sm:gap-4">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm sm:text-base text-text-primary-dark font-semibold leading-relaxed">
                {state.globalError}
              </p>
              {state.globalError === ERROR_MESSAGES.BROWSER_UNSUPPORTED && (
                <p className="text-xs sm:text-sm text-text-secondary-dark leading-relaxed">
                  Please update your browser to use LocalDrop. We recommend Chrome, Firefox, Safari, or Edge.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar - Only show if there are files */}
      {state.files.length > 0 && !state.globalError && (
        <div className="flex justify-between items-center bg-surface-dark/50 p-2 rounded-lg border border-border-dark/50">
          <div className="flex flex-col px-2">
            <span className="text-sm text-text-secondary-dark">
              {stats.success} ready, {stats.remaining} remaining
            </span>
            {stats.remaining > 0 && (
              <span className="text-xs text-text-tertiary-dark flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {stats.estimatedSeconds !== null
                  ? `~${stats.estimatedSeconds}s remaining`
                  : 'Calculating time...'
                }
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {stats.success > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="text-xs sm:text-sm px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isZipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isZipping ? 'Zipping...' : 'Download All'}
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs sm:text-sm px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-3">
        {state.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 p-4 bg-surface-dark border border-border-dark rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* Icon / Status */}
            <div className="flex-shrink-0">
              {file.status === 'idle' && (
                <div className="p-2 bg-slate-500/10 rounded-full">
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
              )}
              {file.status === 'processing' && (
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
              {file.status === 'success' && (
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
              {file.status === 'error' && (
                <div className="p-2 bg-red-500/10 rounded-full">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary-dark truncate">
                {file.file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-text-secondary-dark">
                <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                {file.status === 'error' && (
                  <span className="text-red-400">• {file.errorMessage}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {file.status === 'success' && (
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="p-2 text-text-tertiary-dark hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                title="Remove"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

