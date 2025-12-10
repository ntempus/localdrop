'use client'

import { useState, useRef, useCallback, useMemo, memo } from 'react'
import { Upload } from 'lucide-react'
import { DropZoneProps } from '@/lib/types'
import { UI_STATES, FILE_CONSTRAINTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * DropZone component for file input handling
 * 
 * Supports drag-and-drop and click-to-upload with visual feedback.
 * Ensures mobile compatibility with 44px touch targets and iOS support.
 * 
 * Optimized with React.memo, useCallback, and useMemo to minimize re-renders.
 */
function DropZone({ onFileSelect, disabled, status }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle drag over event - prevent default and set dragging state
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  /**
   * Handle drag leave event - reset dragging state
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * Handle drop event - extract files and call onFileSelect
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) {
      console.log('[DropZone.handleDrop] Drop ignored - component is disabled');
      return;
    }

    const files = Array.from(e.dataTransfer.files)
    console.log('[DropZone.handleDrop] 📥 Files dropped:', {
      count: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });

    if (files.length > 0) {
      console.log('[DropZone.handleDrop] Calling onFileSelect with', files.length, 'files');
      onFileSelect(files)
    }
  }, [disabled, onFileSelect])

  /**
   * Handle click event - trigger file input
   */
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  /**
   * Handle file input change - extract files and call onFileSelect
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    const files = fileList ? Array.from(fileList) : []

    console.log('[DropZone.handleFileChange] 📂 File input changed:', {
      filesCount: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });

    if (files.length > 0) {
      console.log('[DropZone.handleFileChange] Calling onFileSelect with', files.length, 'files');
      onFileSelect(files)
      // Reset input value to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [onFileSelect])

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }, [handleClick])

  // Memoize combined container styles
  const containerStyles = useMemo(() => cn(
    'bg-surface-dark',
    'rounded-xl',
    'border',
    'border-border-dark',
    'p-2',
    'transition-shadow',
    'duration-300'
  ), [])

  // Memoize inner drop zone styles
  const dropZoneStyles = useMemo(() => cn(
    'relative',
    'flex',
    'flex-col',
    'items-center',
    'gap-6',
    'rounded-lg',
    'border',
    'border-dashed',
    'border-border-dark',
    'px-6',
    'py-20',
    'text-center',
    'transition-colors',
    'duration-300',
    disabled && 'opacity-60 cursor-not-allowed pointer-events-none',
    !disabled && isDragging && 'border-border-dark/70 bg-white/5',
    !disabled && !isDragging && 'hover:border-border-dark/70 hover:bg-white/5'
  ), [disabled, isDragging])

  return (
    <>
      <div className={containerStyles}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Drop HEIC file here or click to select"
          aria-disabled={disabled}
          className={dropZoneStyles}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-dark/20 rounded-lg pointer-events-none" />

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Icon container */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-border-dark">
              <Upload
                className={cn(
                  'w-7 h-7',
                  'text-text-primary-dark',
                  'transition-colors duration-75',
                  isDragging && 'scale-110',
                  status === 'processing' && 'text-text-secondary-dark',
                  status === 'success' && 'text-primary'
                )}
                aria-hidden="true"
              />
            </div>

            {/* Text Content */}
            <div className="flex max-w-sm flex-col items-center gap-2">
              <p className={cn(
                'text-lg',
                'font-medium',
                'leading-tight',
                'text-text-primary-dark',
                'transition-colors duration-75',
                status === 'success' && 'text-primary'
              )}>
                {isDragging
                  ? 'Drop your HEIC file here'
                  : status === 'processing'
                    ? 'Processing your files...'
                    : status === 'success'
                      ? 'Conversion complete!'
                      : 'Drag and drop files here'}
              </p>
              {(status === 'idle' || status === 'error') && (
                <p className="text-sm font-normal leading-normal text-text-secondary-dark">
                  Your files are processed locally and never leave your browser.
                </p>
              )}
            </div>

            {/* Or divider */}
            {(status === 'idle' || status === 'error') && (
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-border-dark"></div>
                <span className="text-xs text-text-tertiary-dark uppercase font-medium">Or</span>
                <div className="h-px w-12 bg-border-dark"></div>
              </div>
            )}

            {/* Select Files button */}
            {(status === 'idle' || status === 'error') && (
              <button
                type="button"
                className="flex min-w-[84px] max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-text-primary-dark text-background-dark text-sm font-semibold leading-normal shadow-sm transition-all hover:bg-text-secondary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                <span className="truncate">Select Files</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".heic,.HEIC"
        onChange={handleFileChange}
        disabled={disabled}
        multiple
        className="hidden"
        aria-label="HEIC file input"
      />
    </>
  )
}

// Memoize component to prevent unnecessary re-renders when parent state changes
// but DropZone props remain the same
export default memo(DropZone)

