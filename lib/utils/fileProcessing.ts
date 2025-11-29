/**
 * File processing utilities for Base64 storage
 * Handles compression, validation, and Firestore size limits
 */

export interface ProcessedFile {
  base64: string;
  originalName: string;
  mimeType: string;
  sizeKB: number;
  processedAt: Date;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compress and convert image to Base64
 * @throws Error if result exceeds maxSizeKB
 */
export async function compressImageToBase64(
  file: File,
  options: CompressionOptions = {},
  maxSizeKB: number = 200
): Promise<ProcessedFile> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Formato de imagen inválido'));
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Calculate dimensions maintaining aspect ratio
          if (width > height && width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }
          
          // Draw with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try with specified quality first
          let base64 = canvas.toDataURL(outputFormat, quality);
          let currentSizeKB = estimateBase64SizeKB(base64);
          
          // If too large, progressively reduce quality
          let currentQuality = quality;
          while (currentSizeKB > maxSizeKB && currentQuality > 0.3) {
            currentQuality -= 0.1;
            base64 = canvas.toDataURL(outputFormat, currentQuality);
            currentSizeKB = estimateBase64SizeKB(base64);
          }
          
          if (currentSizeKB > maxSizeKB) {
            reject(new Error(
              `No se pudo comprimir la imagen a menos de ${maxSizeKB}KB. ` +
              `Tamaño actual: ${Math.round(currentSizeKB)}KB. ` +
              `Por favor usa una imagen más pequeña.`
            ));
            return;
          }
          
          resolve({
            base64,
            originalName: file.name,
            mimeType: outputFormat,
            sizeKB: currentSizeKB,
            processedAt: new Date()
          });
          
        } catch (error) {
          reject(new Error('Error procesando la imagen: ' + (error as Error).message));
        }
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Convert PDF to Base64 (no compression, validation only)
 * @throws Error if PDF exceeds size limit
 */
export async function pdfToBase64(
  file: File,
  maxSizeKB: number = 800
): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const fileSizeKB = file.size / 1024;
    
    if (fileSizeKB > maxSizeKB) {
      reject(new Error(
        `El PDF es demasiado grande (${Math.round(fileSizeKB)}KB). ` +
        `El límite es ${maxSizeKB}KB. ` +
        `Por favor comprime el PDF externamente o sube una versión más ligera.`
      ));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Error leyendo el PDF'));
    
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      resolve({
        base64,
        originalName: file.name,
        mimeType: file.type,
        sizeKB: fileSizeKB,
        processedAt: new Date()
      });
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Smart file processor - detects type and applies appropriate strategy
 */
export async function processFileForStorage(
  file: File,
  type: 'profile' | 'certificate'
): Promise<ProcessedFile> {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  
  if (!isImage && !isPDF) {
    throw new Error(
      'Tipo de archivo no soportado. ' +
      'Solo se aceptan imágenes (JPG, PNG, WEBP) y PDFs.'
    );
  }
  
  if (type === 'profile') {
    // Profile photos: aggressive compression
    if (!isImage) {
      throw new Error('La foto de perfil debe ser una imagen (JPG, PNG, WEBP)');
    }
    return compressImageToBase64(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      outputFormat: 'image/jpeg'
    }, 200);
  }
  
  // Certificates: moderate compression for images, validation for PDFs
  if (isImage) {
    return compressImageToBase64(file, {
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 0.85,
      outputFormat: 'image/jpeg'
    }, 700);
  }
  
  return pdfToBase64(file, 800);
}

/**
 * Estimate Base64 string size in KB
 */
function estimateBase64SizeKB(base64: string): number {
  // Base64 is ~33% larger than binary
  // Subtract data URL prefix length
  const base64Data = base64.split(',')[1] || base64;
  const binarySize = (base64Data.length * 3) / 4;
  return binarySize / 1024;
}

/**
 * Create thumbnail from Base64 image (for list views)
 */
export async function createThumbnail(
  base64Image: string,
  maxSize: number = 100
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onerror = () => reject(new Error('Error creando thumbnail'));
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > height) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    
    img.src = base64Image;
  });
}

/**
 * Validate file before processing
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = options;
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

