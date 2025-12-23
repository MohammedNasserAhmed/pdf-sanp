
import { RenderResult } from '../types';

declare const pdfjsLib: any;

/**
 * Renders the first page of a PDF file to a PNG blob at 300 DPI.
 * Ensures zero margins and pixel-perfect accuracy.
 */
export async function renderFirstPage(file: File): Promise<RenderResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      stopAtErrors: false
    });
    const pdf = await loadingTask.promise;
    
    if (pdf.isLocked) {
      throw new Error("Password-protected PDFs are not supported.");
    }

    // Extraction: Native First Page
    const page = await pdf.getPage(1);
    
    // Resolution Math: 
    // Standard PDF = 72 Points per Inch.
    // Target = 300 Dots per Inch.
    // Scale Factor = 300 / 72 = 4.16666666667
    const scale = 300 / 72;
    const viewport = page.getViewport({ scale });

    // Initialize high-precision canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true
    });
    
    if (!context) {
      throw new Error("Canvas 2D context initialization failed.");
    }

    // Enforce pixel-perfect dimensions (No margins)
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'print', // Use print intent for CMYK -> RGB color fidelity
    };

    await page.render(renderContext).promise;

    // Export: Lossless PNG
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          // Filename Rule: [original_name].pdf -> [original_name].png
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const outputName = `${baseName}.png`;
          resolve({ blob, filename: outputName });
        } else {
          reject(new Error("PNG encoding failed."));
        }
      }, 'image/png');
    });
  } catch (error: any) {
    console.error("Critical Rendering Error:", error);
    throw new Error(error.message || "Rendering pipeline failed.");
  }
}

/**
 * Deterministic Browser Download Trigger.
 * Increased timeout for URL revocation to fix failed downloads.
 */
export function triggerDownload(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();

    // Standard cleanup cycle - increased to 1 minute to ensure large file downloads aren't killed early
    setTimeout(() => {
      if (anchor.parentNode) {
        document.body.removeChild(anchor);
      }
      URL.revokeObjectURL(url);
    }, 60000);
  } catch (err) {
    console.error("Download trigger failed:", err);
  }
}
