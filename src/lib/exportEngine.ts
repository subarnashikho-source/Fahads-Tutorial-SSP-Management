import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { OFFICIAL_LOGO_BASE64, applyPdfWatermark, DEFAULT_BRANDING } from './branding';

export interface ColumnDefinition {
  header: string;
  key: string;
  width?: number; // relative weight or mm width
  align?: 'left' | 'center' | 'right';
}

export interface SummaryCard {
  label: string;
  value: string | number;
}

export interface UniversalExportOptions {
  reportTitle: string;
  baseFilename: string; // e.g. "Fahads-Tutorial-Attendance-Report"
  period?: string;
  generatedBy?: string;
  filterDescription?: string;
  columns: ColumnDefinition[];
  data: Record<string, any>[];
  summaryCards?: SummaryCard[];
  orientation?: 'portrait' | 'landscape';
  watermarkOpacity?: number;
}

/**
 * Universal PDF Generator:
 * Generates an authentic, professional multi-page PDF where:
 * 1. The official Fahad's Tutorial logo appears in the header.
 * 2. Table headers repeat when content spans multiple pages.
 * 3. The official logo watermark is stamped on EVERY SINGLE PAGE (Page 1, 2, 3, etc.) at the PDF graphics level.
 * 4. Page numbers are added on every page.
 */
export async function generateUniversalPdf(options: UniversalExportOptions): Promise<void> {
  const {
    reportTitle,
    baseFilename,
    period,
    generatedBy = 'Ananya Rahman (Head of SSP)',
    filterDescription,
    columns,
    data,
    summaryCards = [],
    orientation = 'portrait',
    watermarkOpacity = DEFAULT_BRANDING.defaultWatermarkOpacity,
  } = options;

  const doc = new jsPDF({
    orientation: orientation === 'portrait' ? 'p' : 'l',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Helper to draw standard header on any page
  const drawPageHeader = (pageNumber: number) => {
    // Logo in header
    try {
      doc.addImage(OFFICIAL_LOGO_BASE64, 'JPEG', margin, y - 4, 15, 15);
    } catch (e) {
      console.warn('Could not draw header logo:', e);
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("FAHAD'S TUTORIAL – SSP MANAGEMENT SYSTEM", margin + 18, y + 1);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(reportTitle.toUpperCase(), margin + 18, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Period: ${period || 'All Records'}  |  Generated: ${new Date().toLocaleString()}  |  By: ${generatedBy}`,
      margin + 18,
      y + 10
    );

    if (filterDescription && pageNumber === 1) {
      doc.text(`Active Filters: ${filterDescription}`, margin + 18, y + 14);
      y += 4;
    }

    // Header divider line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 14, pageWidth - margin, y + 14);

    y += 20;
  };

  drawPageHeader(1);

  // Draw Summary KPI Cards on Page 1 if present
  if (summaryCards.length > 0) {
    const cardWidth = (contentWidth - (summaryCards.length - 1) * 3) / summaryCards.length;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);

    summaryCards.forEach((card, idx) => {
      const cardX = margin + idx * (cardWidth + 3);
      doc.roundedRect(cardX, y, cardWidth, 14, 1.5, 1.5, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), cardX + 3, y + 4.5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(card.value), cardX + 3, y + 10.5);
    });

    y += 18;
  }

  // Calculate table column widths
  const totalCustomWidth = columns.reduce((s, c) => s + (c.width || 1), 0);
  const colWidths = columns.map(c => ((c.width || 1) / totalCustomWidth) * contentWidth);

  // Helper to draw Table Header row (repeated on every page!)
  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    let curX = margin;
    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const text = col.header;
      if (col.align === 'right') {
        doc.text(text, curX + w - 2, y, { align: 'right' });
      } else if (col.align === 'center') {
        doc.text(text, curX + w / 2, y, { align: 'center' });
      } else {
        doc.text(text, curX + 2, y);
      }
      curX += w;
    });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 6.5;
  };

  drawTableHeader();

  // Draw Data Rows
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  data.forEach((item, rowIdx) => {
    // Check if new page is needed
    if (y + 7 > pageHeight - 16) {
      doc.addPage();
      y = 18;
      drawPageHeader(doc.getNumberOfPages());
      drawTableHeader();
    }

    // Subtle alternating row background
    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, contentWidth, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    let curX = margin;

    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const val = item[col.key] !== undefined && item[col.key] !== null ? String(item[col.key]) : '—';

      // Truncate if too long for cell
      const maxChars = Math.max(4, Math.floor(w / 1.9));
      const truncated = val.length > maxChars ? val.substring(0, maxChars - 2) + '..' : val;

      if (col.align === 'right') {
        doc.text(truncated, curX + w - 2, y, { align: 'right' });
      } else if (col.align === 'center') {
        doc.text(truncated, curX + w / 2, y, { align: 'center' });
      } else {
        doc.text(truncated, curX + 2, y);
      }
      curX += w;
    });

    // Row underline
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.1);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 6;
  });

  // Stamp Page Numbers on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Fahads Tutorial – Official SSP Record  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // UNIVERSAL WATERMARK STAMPER:
  // Loops through EVERY PAGE (1, 2, 3... totalPages) and stamps the official circular logo watermark!
  applyPdfWatermark(doc, { opacity: watermarkOpacity });

  const safeFilename = `${baseFilename.replace(/\s+/g, '-')}.pdf`;
  doc.save(safeFilename);
}

/**
 * Universal Excel (.xlsx) Generator:
 * Creates an authentic multi-sheet or single sheet Excel file with formatted headers.
 */
export function generateUniversalExcel(options: UniversalExportOptions): void {
  const { baseFilename, columns, data, reportTitle, period } = options;

  const excelRows = data.map(item => {
    const rowObj: Record<string, any> = {};
    columns.forEach(col => {
      rowObj[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
    });
    return rowObj;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths
  ws['!cols'] = columns.map(c => ({
    wch: Math.max(c.header.length + 4, 14),
  }));

  const sheetName = reportTitle.substring(0, 30).replace(/[:\\\/\?\*\[\]]/g, ' ');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeFilename = `${baseFilename.replace(/\s+/g, '-')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Universal CSV (.csv) Generator:
 * Generates an authentic CSV with UTF-8 BOM (\uFEFF) to guarantee that Bengali characters
 * and UTF-8 text render with 100% fidelity in Microsoft Excel, Google Sheets, etc.
 */
export function generateUniversalCsv(options: UniversalExportOptions): void {
  const { baseFilename, columns, data } = options;

  const escapeCsvValue = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = columns.map(c => escapeCsvValue(c.header)).join(',');
  const rowLines = data.map(item => {
    return columns.map(c => escapeCsvValue(item[c.key])).join(',');
  });

  // Prepend UTF-8 BOM so Excel opens Bengali and Unicode properly without gibberish
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${baseFilename.replace(/\s+/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
