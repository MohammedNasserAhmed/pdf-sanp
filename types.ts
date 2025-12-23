
export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface PDFFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  error?: string;
  progress: number;
  resultBlob?: Blob;
  resultFilename?: string;
}

export interface RenderResult {
  blob: Blob;
  filename: string;
}
