/**
 * Image compression and Base64 encoding utilities
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionResult {
  full: string; // Full size Base64 (800x800, ~200KB)
  thumbnail: string; // Thumbnail Base64 (100x100, ~20KB)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  maxSizeKB: 200,
};

const THUMBNAIL_OPTIONS: CompressionOptions = {
  maxWidth: 100,
  maxHeight: 100,
  quality: 0.7,
  maxSizeKB: 20,
};

/**
 * Compresses and encodes an image file to Base64 string (full size only)
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Base64 data URL string
 */
export async function compressAndEncodeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      reject(new Error("Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP)"));
      return;
    }

    // Validate file size (5MB limit before compression)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      reject(new Error("El archivo es demasiado grande. Máximo 5MB"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height && width > (opts.maxWidth || 800)) {
          height = (height * (opts.maxWidth || 800)) / width;
          width = opts.maxWidth || 800;
        } else if (height > (opts.maxHeight || 800)) {
          width = (width * (opts.maxHeight || 800)) / height;
          height = opts.maxHeight || 800;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Error al procesar la imagen"));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 with compression
        const base64 = canvas.toDataURL("image/jpeg", opts.quality || 0.8);

        // Check final size (Base64 string is ~33% larger than binary)
        const base64SizeKB = (base64.length * 3) / 4 / 1024;
        const maxSizeKB = opts.maxSizeKB || 200;

        if (base64SizeKB > maxSizeKB) {
          // Try with lower quality
          const lowerQuality = Math.max(0.5, (opts.quality || 0.8) - 0.1);
          const retryBase64 = canvas.toDataURL("image/jpeg", lowerQuality);
          const retrySizeKB = (retryBase64.length * 3) / 4 / 1024;

          if (retrySizeKB > maxSizeKB) {
            reject(
              new Error(
                `La imagen comprimida es demasiado grande (${retrySizeKB.toFixed(0)}KB). Por favor, usa una imagen más pequeña.`
              )
            );
            return;
          }

          resolve(retryBase64);
        } else {
          resolve(base64);
        }
      };

      img.onerror = () => {
        reject(new Error("Error al cargar la imagen"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses and encodes an image file to both full and thumbnail Base64 strings
 * @param file - Image file to compress
 * @param fullOptions - Compression options for full size
 * @param thumbnailOptions - Compression options for thumbnail
 * @returns Object with full and thumbnail Base64 strings
 */
export async function compressAndEncodeImageWithThumbnail(
  file: File,
  fullOptions: CompressionOptions = {},
  thumbnailOptions: CompressionOptions = {}
): Promise<CompressionResult> {
  const fullOpts = { ...DEFAULT_OPTIONS, ...fullOptions };
  const thumbOpts = { ...THUMBNAIL_OPTIONS, ...thumbnailOptions };

  // Validate file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP)");
  }

  // Validate file size (5MB limit before compression)
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxFileSize) {
    throw new Error("El archivo es demasiado grande. Máximo 5MB");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Generate full size
        const fullCanvas = document.createElement("canvas");
        let fullWidth = img.width;
        let fullHeight = img.height;

        // Calculate full size dimensions
        if (fullWidth > fullHeight && fullWidth > (fullOpts.maxWidth || 800)) {
          fullHeight = (fullHeight * (fullOpts.maxWidth || 800)) / fullWidth;
          fullWidth = fullOpts.maxWidth || 800;
        } else if (fullHeight > (fullOpts.maxHeight || 800)) {
          fullWidth = (fullWidth * (fullOpts.maxHeight || 800)) / fullHeight;
          fullHeight = fullOpts.maxHeight || 800;
        }

        fullCanvas.width = fullWidth;
        fullCanvas.height = fullHeight;

        const fullCtx = fullCanvas.getContext("2d");
        if (!fullCtx) {
          reject(new Error("Error al procesar la imagen"));
          return;
        }

        fullCtx.drawImage(img, 0, 0, fullWidth, fullHeight);
        const fullBase64 = fullCanvas.toDataURL("image/jpeg", fullOpts.quality || 0.8);

        // Check full size
        const fullSizeKB = (fullBase64.length * 3) / 4 / 1024;
        const maxFullSizeKB = fullOpts.maxSizeKB || 200;

        if (fullSizeKB > maxFullSizeKB) {
          const lowerQuality = Math.max(0.5, (fullOpts.quality || 0.8) - 0.1);
          const retryBase64 = fullCanvas.toDataURL("image/jpeg", lowerQuality);
          const retrySizeKB = (retryBase64.length * 3) / 4 / 1024;

          if (retrySizeKB > maxFullSizeKB) {
            reject(
              new Error(
                `La imagen comprimida es demasiado grande (${retrySizeKB.toFixed(0)}KB). Por favor, usa una imagen más pequeña.`
              )
            );
            return;
          }
        }

        // Generate thumbnail
        const thumbCanvas = document.createElement("canvas");
        let thumbWidth = img.width;
        let thumbHeight = img.height;

        // Calculate thumbnail dimensions
        if (thumbWidth > thumbHeight && thumbWidth > (thumbOpts.maxWidth || 100)) {
          thumbHeight = (thumbHeight * (thumbOpts.maxWidth || 100)) / thumbWidth;
          thumbWidth = thumbOpts.maxWidth || 100;
        } else if (thumbHeight > (thumbOpts.maxHeight || 100)) {
          thumbWidth = (thumbWidth * (thumbOpts.maxHeight || 100)) / thumbHeight;
          thumbHeight = thumbOpts.maxHeight || 100;
        }

        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;

        const thumbCtx = thumbCanvas.getContext("2d");
        if (!thumbCtx) {
          reject(new Error("Error al procesar la imagen"));
          return;
        }

        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        const thumbBase64 = thumbCanvas.toDataURL("image/jpeg", thumbOpts.quality || 0.7);

        resolve({
          full: fullBase64,
          thumbnail: thumbBase64,
        });
      };

      img.onerror = () => {
        reject(new Error("Error al cargar la imagen"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a Base64 string is within size limits
 * @param base64 - Base64 data URL string
 * @param maxSizeKB - Maximum size in KB (default: 900KB)
 * @returns true if valid, false otherwise
 */
export function validateBase64Size(base64: string, maxSizeKB: number = 900): boolean {
  const sizeKB = (base64.length * 3) / 4 / 1024;
  return sizeKB <= maxSizeKB;
}

