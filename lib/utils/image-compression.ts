/**
 * Image compression and Base64 encoding utilities
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  maxSizeKB: 200,
};

/**
 * Compresses and encodes an image file to Base64 string
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
 * Validates if a Base64 string is within size limits
 * @param base64 - Base64 data URL string
 * @param maxSizeKB - Maximum size in KB (default: 900KB)
 * @returns true if valid, false otherwise
 */
export function validateBase64Size(base64: string, maxSizeKB: number = 900): boolean {
  const sizeKB = (base64.length * 3) / 4 / 1024;
  return sizeKB <= maxSizeKB;
}

