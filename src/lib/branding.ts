import { jsPDF } from 'jspdf';
import { OFFICIAL_LOGO_BASE64 } from './logoBase64';

export const OFFICIAL_LOGO_PATH = '/assets/official-logo.png';
export { OFFICIAL_LOGO_BASE64 };

export interface WatermarkConfig {
  logoUrl?: string;
  opacity?: number; // default 0.06 (subtle & professional)
  sizeMm?: number;  // diameter in mm for A4 (default 100mm)
  enabled?: boolean;
}

export const DEFAULT_BRANDING = {
  companyName: "Fahad's Tutorial",
  subTitle: 'SSP Management System',
  slogan: 'INFINITY IS THE LIMIT',
  officialLogoPath: OFFICIAL_LOGO_PATH,
  defaultWatermarkOpacity: 0.06, // subtle, keeps text 100% readable
  printWatermarkEnabled: true,
  pdfWatermarkEnabled: true,
};

/**
 * Universal PDF Watermark Stamper:
 * Iterates through every single page of a jsPDF document and embeds the
 * official circular Fahad's Tutorial logo watermark behind the content.
 */
export function applyPdfWatermark(
  doc: jsPDF,
  config?: WatermarkConfig
): void {
  const opacity = config?.opacity ?? DEFAULT_BRANDING.defaultWatermarkOpacity;
  const enabled = config?.enabled ?? DEFAULT_BRANDING.pdfWatermarkEnabled;

  if (!enabled || opacity <= 0) return;

  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Standard A4: 210mm x 297mm (Portrait) or 297mm x 210mm (Landscape)
    // Logo is square 1:1 circular badge
    const diameter = config?.sizeMm ?? Math.min(pageWidth, pageHeight) * 0.52; // ~52% of narrow dimension
    const x = (pageWidth - diameter) / 2;
    const y = (pageHeight - diameter) / 2;

    try {
      doc.saveGraphicsState();
      // Set transparency using GState if supported
      const gState = new (doc as any).GState({ opacity });
      doc.setGState(gState);

      // Add official logo without stretching, preserving 1:1 circular proportion
      doc.addImage(OFFICIAL_LOGO_BASE64, 'JPEG', x, y, diameter, diameter, undefined, 'FAST');
      doc.restoreGraphicsState();
    } catch (e) {
      console.warn('PDF watermark fallback application:', e);
      // Fallback without GState
      try {
        doc.addImage(OFFICIAL_LOGO_BASE64, 'JPEG', x, y, diameter, diameter, undefined, 'FAST');
      } catch (err) {
        console.error('Failed to embed watermark image in PDF:', err);
      }
    }
  }
}
