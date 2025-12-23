
import React, { useState, useRef, useEffect } from 'react';
import { PDFFile, ProcessingStatus } from './types';
import ProcessingTable from './components/ProcessingTable';
import { renderFirstPage, triggerDownload } from './services/pdfProcessor';
import JSZip from 'jszip';

/**
 * Sanitizes a filename to ensure it is "regular" (alphanumeric, dots, hyphens, underscores).
 * Replaces non-alphanumeric characters with underscores.
 */
function sanitizeFilename(name: string): string {
  const extensionIndex = name.lastIndexOf('.');
  const base = extensionIndex !== -1 ? name.substring(0, extensionIndex) : name;
  const ext = extensionIndex !== -1 ? name.substring(extensionIndex) : '';
  
  const cleanBase = base
    .replace(/[^a-z0-9-_]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
    
  return (cleanBase || 'document') + ext.toLowerCase();
}

const App: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (incomingFiles: FileList | File[]) => {
    const newFiles: PDFFile[] = Array.from(incomingFiles)
      .filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .map((f: File) => {
        const sanitizedName = sanitizeFilename(f.name);
        let finalFile = f;
        
        if (sanitizedName !== f.name) {
          console.log(`[RENAMING PIPELINE] Original: "${f.name}" -> Sanitized: "${sanitizedName}"`);
          finalFile = new File([f], sanitizedName, { type: f.type });
        }

        return {
          id: crypto.randomUUID(),
          file: finalFile,
          originalFilename: f.name,
          status: ProcessingStatus.PENDING,
          progress: 0,
        };
      });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
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
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    const pdfFolder = zip.folder("pdfs");
    const screenshotFolder = zip.folder("screenshots");

    completedFiles.forEach(f => {
      // Add renamed PDF
      pdfFolder?.file(f.file.name, f.file);
      // Add Screenshot PNG (name matched strictly in renderer)
      if (f.resultBlob && f.resultFilename) {
        screenshotFolder?.file(f.resultFilename, f.resultBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `pdf_snap_package_${new Date().getTime()}.zip`);
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const currentFiles = [...files];

    for (let i = 0; i < currentFiles.length; i++) {
      if (currentFiles[i].status === ProcessingStatus.COMPLETED) continue;

      currentFiles[i] = { ...currentFiles[i], status: ProcessingStatus.PROCESSING, error: undefined };
      setFiles([...currentFiles]);

      try {
        const result = await renderFirstPage(currentFiles[i].file);
        currentFiles[i] = { 
          ...currentFiles[i], 
          status: ProcessingStatus.COMPLETED,
          resultBlob: result.blob,
          resultFilename: result.filename
        };
      } catch (err: any) {
        currentFiles[i] = { 
          ...currentFiles[i], 
          status: ProcessingStatus.FAILED, 
          error: err.message || "Processing failed" 
        };
      }
      setFiles([...currentFiles]);
    }

    setIsProcessing(false);
    
    const successfulCount = currentFiles.filter(f => f.status === ProcessingStatus.COMPLETED).length;
    if (successfulCount > 0) {
      setTimeout(() => {
        downloadAllAsZip();
      }, 500);
    }
  };

  const completedCount = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <LogoIcon />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-bright-black sm:text-5xl uppercase italic font-display">
              PDF Snap <span className="text-dark-orange">Pro</span>
            </h1>
            <p className="text-[10px] font-bold text-dark-orange tracking-[0.4em] uppercase mt-1">
              High-Resolution Pipeline &bull; Auto-Sanitize &bull; Unified Export
            </p>
          </div>
        </div>
      </header>

      <main>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mb-10">
            
            <div className="lg:col-span-2 space-y-6">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 bg-gray-50/30 rounded-[2rem] border-4 border-dashed transition-all cursor-pointer relative overflow-hidden group
                  ${isDragging ? 'border-dark-orange bg-orange-50/50 scale-[1.01]' : 'border-gray-200 hover:border-dark-orange'}`}
              >
                {isDragging && (
                  <div className="absolute inset-0 bg-dark-orange/5 flex items-center justify-center pointer-events-none">
                    <div className="animate-bounce">
                      <DropIconLarge />
                    </div>
                  </div>
                )}
                
                <div className={`flex flex-col items-center justify-center gap-5 transition-opacity ${isDragging ? 'opacity-20' : 'opacity-100'}`}>
                  <div className="bg-white p-5 rounded-2xl shadow-sm text-gray-400 group-hover:text-dark-orange group-hover:shadow-md transition-all">
                    <CloudUploadIcon />
                  </div>
                  <div className="text-center">
                    <label className="block text-xl font-bold leading-6 text-bright-black mb-1 tracking-tight">
                      Drop PDFs here or click to upload
                    </label>
                    <p className="text-sm font-medium text-gray-400">
                      Supports multiple files &bull; Auto-sanitization active
                    </p>
                  </div>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                {files.length > 0 && !isDragging && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearList(); }} 
                      className="px-5 py-2 text-[11px] text-red-600 hover:bg-red-50 rounded-xl font-bold uppercase tracking-widest transition-colors border border-red-100"
                    >
                      Reset Queue
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <button
                  onClick={processBatch}
                  disabled={isProcessing || files.length === 0}
                  className="bg-dark-orange text-white py-6 px-8 rounded-[1.5rem] font-bold shadow-2xl shadow-orange-100 hover:bg-vibrant-orange disabled:bg-gray-100 disabled:shadow-none disabled:text-gray-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-lg tracking-tight uppercase"
                >
                  {isProcessing ? (
                    <>
                      <Spinner /> ENGINE ACTIVE
                    </>
                  ) : (
                    <>
                      <PlayIcon /> PROCESS & DOWNLOAD ({files.filter(f => f.status !== ProcessingStatus.COMPLETED).length})
                    </>
                  )}
                </button>

                {completedCount > 0 && !isProcessing && (
                  <button
                    onClick={downloadAllAsZip}
                    className="bg-bright-black text-white py-6 px-8 rounded-[1.5rem] font-bold shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-lg tracking-tight uppercase"
                  >
                    <DownloadIcon /> DOWNLOAD ALL ({completedCount})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-bright-black p-8 rounded-[2rem] shadow-2xl border border-gray-800 text-white">
              <h3 className="text-xs font-bold text-dark-orange uppercase tracking-[0.25em] mb-8 border-b border-gray-800 pb-4 font-mono">Automated Pipeline</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="bg-dark-orange/20 p-2 rounded-lg"><SanitizeIcon /></div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white mb-1">Strict Renaming</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Filenames are sanitized before processing. Screenshot names strictly match.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-dark-orange/20 p-2 rounded-lg"><DpiIcon /></div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white mb-1">300 DPI Rendering</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">High-fidelity rasterization using native PDF vector logic.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-dark-orange/20 p-2 rounded-lg"><ZipIcon /></div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white mb-1">Unified ZIP</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Batch download both original sanitized sources and snapshots.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 right-0 py-2 text-[10px] font-bold uppercase text-dark-orange tracking-[0.2em] bg-orange-50 px-5 rounded-bl-2xl rounded-tr-2xl border-l border-b border-orange-100 font-mono">
              Live Queue
            </div>
            <ProcessingTable files={files} onProcessSingle={processFileById} />
          </div>
        </div>
      </main>

      <footer className="mt-16 flex flex-col items-center gap-4">
        <div className="h-px w-24 bg-gray-100"></div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] font-mono">
          Production Grade &bull; Deterministic &bull; 100% Client-Side
        </p>
      </footer>
    </div>
  );
};

// --- ICONS ---

const LogoIcon = () => (
  <div className="bg-dark-orange p-3 rounded-2xl shadow-2xl shadow-orange-100">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM16.5 10.5a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25V3.375c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125V9h2.25Z" />
    </svg>
  </div>
);

const CloudUploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

const DropIconLarge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-20 h-20 text-dark-orange">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const SanitizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-orange">
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.982a.75.75 0 0 0-.75.75v4.25a.75.75 0 0 0 1.5 0v-2.22l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 1 0-1.442-.307ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h4.25a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-1.5 0v2.22l-.31-.31a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.442.307Z" clipRule="evenodd" />
  </svg>
);

const DpiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-orange">
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
  </svg>
);

const ZipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-orange">
    <path d="M4.75 3A1.75 1.75 0 0 0 3 4.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 17 15.25V4.75A1.75 1.75 0 0 0 15.25 3H4.75ZM5 7a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H6Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H6Z" />
  </svg>
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

const Spinner = () => (
  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default App;
