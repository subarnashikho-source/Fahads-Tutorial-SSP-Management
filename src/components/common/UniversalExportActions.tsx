import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  UniversalExportOptions,
  generateUniversalPdf,
  generateUniversalExcel,
  generateUniversalCsv,
} from '../../lib/exportEngine';

interface UniversalExportActionsProps {
  options: UniversalExportOptions;
  onPrint?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const UniversalExportActions: React.FC<UniversalExportActionsProps> = ({
  options,
  onPrint,
  className = '',
  size = 'md',
}) => {
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const showStatus = (text: string, isError: boolean) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handlePdf = async () => {
    if (activeExport) return;
    setActiveExport('pdf');
    try {
      await generateUniversalPdf(options);
      showStatus(`Generated ${options.baseFilename}.pdf`, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showStatus(`PDF generation error: ${msg}`, true);
    } finally {
      setActiveExport(null);
    }
  };

  const handleExcel = async () => {
    if (activeExport) return;
    setActiveExport('excel');
    try {
      generateUniversalExcel(options);
      showStatus(`Exported ${options.baseFilename}.xlsx`, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showStatus(`Excel export error: ${msg}`, true);
    } finally {
      setActiveExport(null);
    }
  };

  const handleCsv = async () => {
    if (activeExport) return;
    setActiveExport('csv');
    try {
      generateUniversalCsv(options);
      showStatus(`Exported ${options.baseFilename}.csv`, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showStatus(`CSV export error: ${msg}`, true);
    } finally {
      setActiveExport(null);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const btnPadding = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <div className={`flex flex-wrap items-center gap-2 print:hidden ${className}`}>
      {/* Print */}
      <button
        type="button"
        onClick={handlePrint}
        disabled={Boolean(activeExport)}
        title="Print official report with repeating header & page watermark"
        className={`flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition disabled:opacity-50 ${btnPadding}`}
      >
        <Printer size={14} className="text-slate-500" />
        <span>Print</span>
      </button>

      {/* PDF */}
      <button
        type="button"
        onClick={handlePdf}
        disabled={Boolean(activeExport)}
        title="Generate multi-page PDF with watermark stamped on every page"
        className={`flex items-center gap-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-2xs transition disabled:opacity-50 ${btnPadding}`}
      >
        {activeExport === 'pdf' ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        <span>{activeExport === 'pdf' ? 'Generating PDF...' : 'Download PDF'}</span>
      </button>

      {/* Excel */}
      <button
        type="button"
        onClick={handleExcel}
        disabled={Boolean(activeExport)}
        title="Download spreadsheet in .xlsx format"
        className={`flex items-center gap-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition disabled:opacity-50 ${btnPadding}`}
      >
        {activeExport === 'excel' ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <FileSpreadsheet size={14} />
        )}
        <span>{activeExport === 'excel' ? 'Generating Excel...' : 'Excel (.xlsx)'}</span>
      </button>

      {/* CSV */}
      <button
        type="button"
        onClick={handleCsv}
        disabled={Boolean(activeExport)}
        title="Download comma-separated file in .csv format with UTF-8 Bengali encoding"
        className={`flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition disabled:opacity-50 ${btnPadding}`}
      >
        {activeExport === 'csv' ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <FileText size={14} />
        )}
        <span>{activeExport === 'csv' ? 'Generating CSV...' : 'CSV (.csv)'}</span>
      </button>

      {/* Status toast if active */}
      {statusMessage && (
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md animate-in fade-in ${
            statusMessage.isError
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {statusMessage.isError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
          {statusMessage.text}
        </span>
      )}
    </div>
  );
};
