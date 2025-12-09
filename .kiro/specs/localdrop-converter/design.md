# Design Document: LocalDrop HEIC Converter

## Overview

LocalDrop is a privacy-first, client-side HEIC converter built on Next.js 15 using the App Router. It utilizes React Server Components for the static shell and Client Components for interactive conversion logic, ensuring optimal performance and SEO while maintaining strict privacy boundaries.

## Architecture

### High-Level Architecture

```
Next.js 15 App Router
├── page.tsx (RSC) - Static shell, SEO metadata
├── Converter.tsx (Client Component) - State management
├── DropZone.tsx (Client Component) - File input UI
├── heic2any (Client-side only) - Conversion engine
└── Memory Management (useEffect cleanup)
```

### Core Components

1. **Server Component Shell**: Static page structure and metadata
2. **Converter Container**: React state management and orchestration
3. **DropZone UI**: File input handling with visual feedback
4. **Conversion Engine**: heic2any integration with error handling
5. **Memory Management**: React lifecycle-aware cleanup

## Components and Interfaces

### 1. Converter Container (Client Component)

**Purpose**: Orchestrates the entire conversion flow with React state management

**Interface**:
```typescript
interface ConverterState {
  file: File | null
  status: 'idle' | 'processing' | 'success' | 'error'
  errorMessage: string
  downloadUrl: string
}

const Converter: React.FC = () => {
  const [state, setState] = useState<ConverterState>()
  const handleFileSelect = (file: File) => void
  const processFile = async (file: File) => void
  const reset = () => void
}
```

**Key Features**:
- React state management for all conversion states
- File validation before processing
- Memory cleanup with useEffect
- Error boundary integration

### 2. DropZone Component (Client Component)

**Purpose**: Handle file input with visual feedback

**Interface**:
```typescript
interface DropZoneProps {
  onFileSelect: (file: File) => void
  disabled: boolean
  status: 'idle' | 'processing' | 'success' | 'error'
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled, status })
```

**Key Features**:
- Drag-and-drop with visual state changes
- Click-to-upload fallback
- Tailwind CSS state styling
- Touch-friendly mobile design

### 3. Conversion Engine Integration

**Purpose**: Client-side heic2any wrapper with SSR safety

**Implementation**:
```typescript
const convertFile = async (file: File): Promise<Blob> => {
  // Dynamic import to avoid SSR issues
  const heic2any = (await import('heic2any')).default
  
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.8
  })
  
  return result as Blob
}
```

**Configuration**:
- Dynamic import for SSR compatibility
- Output format: JPG only
- Quality: 0.8 (80%)
- Error handling for conversion failures

## Data Models

### React State Structure

```typescript
// Main converter state
interface ConverterState {
  file: File | null
  status: 'idle' | 'processing' | 'success' | 'error'
  errorMessage: string
  downloadUrl: string
  filename: string
}

// File validation constants
const FILE_CONSTRAINTS = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.heic', '.HEIC']
} as const

// Conversion configuration
const CONVERSION_CONFIG = {
  toType: 'image/jpeg' as const,
  quality: 0.8
} as const
```

### Error Types and Messages

```typescript
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File too large for browser processing',
  INVALID_FORMAT: 'Please select a HEIC file',
  CONVERSION_FAILED: 'This file appears to be damaged or not a standard HEIC',
  BROWSER_UNSUPPORTED: 'Your browser is too old for privacy-mode'
} as const

type ErrorType = keyof typeof ERROR_MESSAGES
```

### UI State Mapping

```typescript
// Tailwind classes for different states
const UI_STATES = {
  idle: 'border-dashed border-gray-300 bg-gray-50',
  dragging: 'border-solid border-blue-500 bg-blue-50',
  processing: 'border-gray-300 bg-gray-100 cursor-not-allowed',
  success: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50'
} as const
```

## Error Handling

### Validation Errors
- **File size check**: Reject files > 50MB before processing
- **Extension check**: Only allow .heic and .HEIC files
- **Browser compatibility**: Check for Blob, Canvas, and File APIs

### Conversion Errors
- **heic2any failures**: Catch and display user-friendly messages
- **Memory issues**: Handle out-of-memory scenarios gracefully
- **Corrupt files**: Detect and report damaged HEIC files

### Recovery Strategies
- **Automatic cleanup**: Always revoke blob URLs after use
- **State reset**: Clear all state after errors
- **User guidance**: Provide actionable error messages

## Testing Strategy

### Core Functionality Tests
- File validation (size, type, extension)
- Successful HEIC to JPG conversion
- Download link generation and cleanup
- Error handling for various failure modes

### Browser Compatibility Tests
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Feature detection for required APIs

### Performance Tests
- Large file handling (up to 50MB)
- Memory usage monitoring
- Conversion speed benchmarks
- UI responsiveness during processing

### Privacy Validation
- Network monitoring (no external requests)
- Local storage inspection (no data persistence)
- Memory cleanup verification

## Implementation Notes

### Next.js 15 Specific Considerations
- **App Router**: Use RSC for static shell, Client Components for interactivity
- **SSR Safety**: Dynamic import heic2any to avoid window/document errors
- **Hydration**: Ensure client-side state doesn't cause hydration mismatches
- **Bundle Optimization**: heic2any loaded only when needed

### React Patterns
- **State Management**: Single useState for all conversion state
- **Effect Cleanup**: useEffect for blob URL cleanup on unmount
- **Error Boundaries**: Wrap converter in error boundary for graceful failures
- **Memoization**: useMemo for expensive validations if needed

### Performance Optimizations
- **Single file processing**: Prevent memory overload
- **Immediate cleanup**: Revoke blob URLs in useEffect cleanup
- **Dynamic imports**: Load heic2any only when conversion starts
- **React optimizations**: Minimal re-renders with proper state structure

### Mobile Considerations
- **Touch targets**: 44px minimum for all interactive elements
- **iOS compatibility**: Click-to-upload as primary method
- **Responsive design**: Tailwind responsive classes for mobile/desktop
- **Memory management**: More aggressive cleanup on mobile browsers

### Security and Privacy
- **Client-side only**: No server communication after initial page load
- **No persistence**: Files never stored in localStorage or IndexedDB
- **Memory isolation**: Proper blob URL cleanup prevents data leaks
- **Input validation**: File type and size checks before processing