/**
 * File Dropzone Component
 * 
 * Drag-and-drop file upload with validation and preview
 */

'use client';

import { useRef, useState } from 'react';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  file: File;
}

interface FileDropzoneProps {
  files: UploadedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (fileName: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export default function FileDropzone({
  files,
  onAdd,
  onRemove,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['.pdf', '.csv', '.xlsx', '.xls', '.jpg', '.jpeg', '.png']
}: FileDropzoneProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function validateFiles(fileList: FileList | File[]): File[] {
    const validFiles: File[] = [];
    const fileArray = Array.from(fileList);

    setError(null);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`최대 ${maxFiles}개까지 업로드할 수 있습니다`);
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSizeMB) {
        setError(`${file.name}은(는) 너무 큽니다. 최대 ${maxSizeMB}MB까지 가능합니다`);
        continue;
      }

      // Check file type
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExt)) {
        setError(`${file.name}은(는) 지원하지 않는 형식입니다. ${acceptedTypes.join(', ')}만 가능합니다`);
        continue;
      }

      // Check duplicate
      if (files.some(f => f.name === file.name)) {
        setError(`${file.name}은(는) 이미 추가되었습니다`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    const validFiles = validateFiles(droppedFiles);
    
    if (validFiles.length > 0) {
      onAdd(validFiles);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      
      if (validFiles.length > 0) {
        onAdd(validFiles);
      }

      // Reset input
      e.target.value = '';
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('csv')) return '📊';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📈';
    if (type.includes('image')) return '🖼️';
    return '📎';
  }

  return (
    <div className="space-y-4">
      
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`relative p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <svg
            className={`w-16 h-16 mb-4 transition-colors ${
              isDragging ? 'text-indigo-500' : 'text-gray-600'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-white font-medium mb-1">
            {isDragging ? '파일을 놓으세요' : '파일을 드래그하거나 클릭하여 선택'}
          </p>
          <p className="text-gray-400 text-sm">
            PDF, CSV, Excel, 이미지 파일 (최대 {maxSizeMB}MB)
          </p>
          <p className="text-gray-500 text-xs mt-2">
            최대 {maxFiles}개 파일까지 업로드 가능
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">업로드된 파일 ({files.length})</h3>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-2xl mr-3">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{file.name}</p>
                    <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 ml-4">
                  {file.status === 'pending' && (
                    <span className="text-gray-400 text-xs">대기 중</span>
                  )}
                  
                  {file.status === 'uploading' && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                      <span className="text-indigo-400 text-xs">업로드 중</span>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center text-green-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">완료</span>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="flex items-center text-red-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">실패</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file.name);
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
