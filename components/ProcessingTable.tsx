
import React from 'react';
import { PDFFile, ProcessingStatus } from '../types';
import { triggerDownload } from '../services/pdfProcessor';

interface ProcessingTableProps {
  files: PDFFile[];
  onProcessSingle: (fileId: string) => Promise<void>;
}

const ProcessingTable: React.FC<ProcessingTableProps> = ({ files, onProcessSingle }) => {
  if (files.length === 0) return null;

  const handleDownload = (file: PDFFile) => {
    if (file.resultBlob && file.resultFilename) {
      triggerDownload(file.resultBlob, file.resultFilename);
    }
  };

  return (
    <div className="mt-8 overflow-hidden border border-gray-100 rounded-3xl bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 font-sans">
        <thead className="bg-gray-50/50">
          <tr>
            <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">File Name</th>
            <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Size</th>
            <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Status</th>
            <th scope="col" className="px-6 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pr-10">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {files.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-bright-black max-w-[200px] sm:max-w-xs truncate tracking-tight">
                <div className="flex flex-col">
                  <span>{item.file.name}</span>
                  {item.file.name !== item.originalFilename && (
                    <span className="text-[9px] text-orange-500 font-mono font-bold uppercase tracking-tighter">
                      Renamed from: {item.originalFilename}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-[12px] font-mono text-gray-500 font-medium">
                {(item.file.size / 1024).toFixed(1)} KB
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium pr-10">
                <div className="flex justify-end gap-3">
                  {item.status === ProcessingStatus.COMPLETED && item.resultBlob ? (
                    <button 
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-[11px] font-bold rounded-xl text-white bg-bright-black hover:bg-black shadow-sm transition-all active:scale-95 uppercase tracking-tight"
                    >
                      DOWNLOAD PNG
                    </button>
                  ) : item.status === ProcessingStatus.PENDING || item.status === ProcessingStatus.FAILED ? (
                    <button 
                      onClick={() => onProcessSingle(item.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-[11px] font-bold rounded-xl text-white bg-dark-orange hover:bg-vibrant-orange shadow-sm transition-all active:scale-95 uppercase tracking-tight"
                    >
                      {item.status === ProcessingStatus.FAILED ? 'RETRY' : 'PROCESS'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-dark-orange text-[11px] font-bold uppercase tracking-tight">
                      <MiniSpinner /> <span>ENGINE ACTIVE</span>
                    </div>
                  )}
                </div>
                {item.error && (
                  <div className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tight font-mono">{item.error}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MiniSpinner = () => (
  <svg className="animate-spin h-4 w-4 text-dark-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  const styles = {
    [ProcessingStatus.PENDING]: 'bg-gray-100 text-gray-500 border-gray-200',
    [ProcessingStatus.PROCESSING]: 'bg-orange-50 text-dark-orange border-orange-100 animate-pulse',
    [ProcessingStatus.COMPLETED]: 'bg-green-50 text-green-700 border-green-100',
    [ProcessingStatus.FAILED]: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span className={`px-2.5 py-1 inline-flex text-[9px] leading-4 font-bold uppercase tracking-[0.1em] rounded-lg border font-mono ${styles[status]}`}>
      {status}
    </span>
  );
};

export default ProcessingTable;
