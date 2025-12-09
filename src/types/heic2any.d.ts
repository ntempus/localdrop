/**
 * Type declarations for heic2any library
 * Provides TypeScript support for HEIC to JPEG/PNG/GIF conversion
 */

declare module 'heic2any' {
  interface Heic2anyOptions {
    /** The HEIC/HEIF file blob to convert */
    blob: Blob;
    /** Output format type */
    toType?: 'image/jpeg' | 'image/png' | 'image/gif';
    /** Quality for JPEG output (0-1) */
    quality?: number;
    /** Extract all images from HEIC file */
    multiple?: boolean;
    /** Frame interval for GIF output (in seconds) */
    gifInterval?: number;
  }

  /**
   * Convert HEIC/HEIF images to JPEG, PNG, or GIF
   * @param options - Conversion options
   * @returns Promise resolving to converted Blob or array of Blobs
   */
  function heic2any(options: Heic2anyOptions): Promise<Blob | Blob[]>;

  export default heic2any;
}

