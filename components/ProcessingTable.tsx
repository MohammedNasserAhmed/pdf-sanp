
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
    <div className="mt-8 overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">File Name</th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Size</th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider pr-10">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 max-w-[200px] sm:max-w-xs truncate">
                {item.file.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(item.file.size / 1024).toFixed(1)} KB
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium pr-10">
                <div className="flex justify-end gap-2">
                  {item.status === ProcessingStatus.COMPLETED && item.resultBlob ? (
                    <button 
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-black rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all active:scale-95"
                    >
                      DOWNLOAD PNG
                    </button>
                  ) : item.status === ProcessingStatus.PENDING || item.status === ProcessingStatus.FAILED ? (
                    <button 
                      onClick={() => onProcessSingle(item.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-black rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                    >
                      {item.status === ProcessingStatus.FAILED ? 'RETRY' : 'PROCESS'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                      <MiniSpinner /> <span>WORKING</span>
                    </div>
                  )}
                </div>
                {item.error && (
                  <div className="text-[10px] text-red-600 mt-2 font-bold uppercase tracking-tighter">{item.error}</div>
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
  <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  const styles = {
    [ProcessingStatus.PENDING]: 'bg-gray-100 text-gray-600 border-gray-200',
    [ProcessingStatus.PROCESSING]: 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse',
    [ProcessingStatus.COMPLETED]: 'bg-green-50 text-green-700 border-green-100',
    [ProcessingStatus.FAILED]: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-md border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default ProcessingTable;
