/**
 * Client-side image compression utility for mobile camera photos.
 * Ensures images fit well within Vercel's 4.5MB Serverless Function payload limit
 * while maintaining crystal-clear quality for Gemini OCR text recognition.
 */

export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate constrained dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback to original if canvas context fails
        if (typeof fileOrDataUrl === "string") {
          resolve(fileOrDataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        }
        return;
      }

      // Smooth interpolation for crisp text rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export as high-quality, lightweight JPEG
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export const compressImageForOcr = compressImage;

export async function compressImageToBlob(
  fileOrDataUrl: File | Blob | string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85,
  mimeType: "image/webp" | "image/jpeg" = "image/webp"
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not acquire 2D canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try preferred mime type, fallback to jpeg if unsupported
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, mimeType: blob.type || mimeType });
          } else {
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) {
                  resolve({ blob: fallbackBlob, mimeType: fallbackBlob.type || "image/jpeg" });
                } else {
                  reject(new Error("Failed to encode canvas to blob"));
                }
              },
              "image/jpeg",
              quality
            );
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
