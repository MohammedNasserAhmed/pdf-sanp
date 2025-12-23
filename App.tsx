
import React, { useState, useRef } from 'react';
import { PDFFile, ProcessingStatus } from './types';
import ProcessingTable from './components/ProcessingTable';
import { renderFirstPage, triggerDownload } from './services/pdfProcessor';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: PDFFile[] = Array.from(e.target.files).map((f: File) => ({
        id: crypto.randomUUID(),
        file: f,
        status: ProcessingStatus.PENDING,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const clearList = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFileById = async (fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const updatedFiles = [...files];
    const targetFile = updatedFiles[fileIndex];

    updatedFiles[fileIndex] = { ...targetFile, status: ProcessingStatus.PROCESSING, error: undefined };
    setFiles([...updatedFiles]);

    try {
      const result = await renderFirstPage(targetFile.file);
      triggerDownload(result.blob, result.filename);

      updatedFiles[fileIndex] = { 
        ...updatedFiles[fileIndex], 
        status: ProcessingStatus.COMPLETED,
        resultBlob: result.blob,
        resultFilename: result.filename
      };
    } catch (err: any) {
      console.error(`Failed to process ${targetFile.file.name}:`, err);
      updatedFiles[fileIndex] = { 
        ...updatedFiles[fileIndex], 
        status: ProcessingStatus.FAILED, 
        error: err.message || "Processing failed" 
      };
    }
    
    setFiles([...updatedFiles]);
  };

  const downloadAllAsZip = async () => {
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.resultBlob);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    completedFiles.forEach(f => {
      if (f.resultBlob && f.resultFilename) {
        zip.file(f.resultFilename, f.resultBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `pdf_snaps_${new Date().getTime()}.zip`);
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === ProcessingStatus.COMPLETED) continue;

      updatedFiles[i] = { ...updatedFiles[i], status: ProcessingStatus.PROCESSING, error: undefined };
      setFiles([...updatedFiles]);

      try {
        const result = await renderFirstPage(updatedFiles[i].file);
        // We still trigger individual download for immediate feedback
        triggerDownload(result.blob, result.filename);

        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: ProcessingStatus.COMPLETED,
          resultBlob: result.blob,
          resultFilename: result.filename
        };
      } catch (err: any) {
        console.error(`Failed to process ${updatedFiles[i].file.name}:`, err);
        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: ProcessingStatus.FAILED, 
          error: err.message || "Processing failed" 
        };
      }
      
      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    
    // Automatically suggest ZIP download for completed batch to ensure no files were missed by browser blocking
    const successfulCount = updatedFiles.filter(f => f.status === ProcessingStatus.COMPLETED).length;
    if (successfulCount > 1) {
      setTimeout(() => {
        if (confirm(`${successfulCount} images generated. Would you like to download them all in a single ZIP file to ensure nothing was blocked?`)) {
          downloadAllAsZip();
        }
      }, 500);
    }
  };

  const completedCount = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <LogoIcon />
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            PDF Snap
          </h1>
        </div>
        <p className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl font-medium">
          Deterministic 300 DPI snapshots. No margins. Automatic batch extraction.
        </p>
      </header>

      <main>
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-10">
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black leading-6 text-gray-900 mb-3 uppercase tracking-widest">
                  1. Data Ingestion
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0
                      file:text-sm file:font-black
                      file:bg-indigo-600 file:text-white
                      hover:file:bg-indigo-700 cursor-pointer transition-all shadow-md"
                  />
                  {files.length > 0 && (
                    <button onClick={clearList} className="text-sm text-red-600 hover:text-red-800 font-black uppercase">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={processBatch}
                  disabled={isProcessing || files.length === 0}
                  className="w-full bg-indigo-600 text-white py-5 px-8 rounded-2xl font-black shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <Spinner /> ENGINE ACTIVE...
                    </>
                  ) : (
                    <>
                      <PlayIcon /> START BATCH ({files.filter(f => f.status !== ProcessingStatus.COMPLETED).length})
                    </>
                  )}
                </button>

                {completedCount > 0 && !isProcessing && (
                  <button
                    onClick={downloadAllAsZip}
                    className="w-full bg-green-600 text-white py-4 px-8 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                  >
                    <DownloadIcon /> DOWNLOAD ALL AS ZIP ({completedCount})
                  </button>
                )}

                <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <InfoIcon />
                    <div>
                      <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Batch Handling</p>
                      <p className="text-[11px] text-blue-700 leading-relaxed font-bold">
                        Processing multiple files will trigger multiple individual downloads. For large batches, use <strong>"Download All as ZIP"</strong> to avoid browser security blocks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-8 rounded-2xl shadow-inner border border-gray-800 text-white">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Internal Specs</h3>
              <ul className="text-sm space-y-4 font-bold">
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckIcon /> <span className="text-white">300 DPI</span> Native Rasterization
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckIcon /> <span className="text-white">Zero Margin</span> Coordinate Math
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckIcon /> <span className="text-white">Lossless PNG</span> Serialization
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckIcon /> <span className="text-white">Batch ZIP</span> Packaging Available
                </li>
              </ul>
            </div>
          </div>

          <ProcessingTable files={files} onProcessSingle={processFileById} />
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
        <p>Deterministic Engine &bull; System Architect Certified &bull; No Data Exit</p>
      </footer>
    </div>
  );
};

const LogoIcon = () => (
  <div className="bg-indigo-600 p-2 rounded-xl shadow-xl shadow-indigo-200">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM16.5 10.5a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25V3.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125V9h2.25Z" />
    </svg>
  </div>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 shrink-0">
    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.25v2.75a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 9H9Z" clipRule="evenodd" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-indigo-400 shrink-0">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

export default App;
