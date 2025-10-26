/**
 * Free Tier - PDF Upload Page
 * 
 * 크레딧포유 PDF 업로드 → OCR 분석 → 기본 결과
 * 회원가입 불필요
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UploadStep {
  current: 'upload' | 'processing' | 'result';
}

export default function FreeUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Drag & Drop Handlers
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

    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  }

  function validateAndSetFile(selectedFile: File) {
    setError(null);

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setFile(selectedFile);
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setStep('processing');
      setUploadProgress(0);
      setError(null);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'creditforyou');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call API
      const res = await fetch('/api/v1/free/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '분석에 실패했습니다');
      }

      const data = await res.json();

      // Redirect to result page
      setTimeout(() => {
        router.push(`/free/result/${data.analysisId}`);
      }, 500);

    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || '분석 중 오류가 발생했습니다');
      setStep('upload');
      setUploadProgress(0);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            onClick={() => router.push('/')}
            className="flex items-center cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-2"></div>
            <span className="text-white font-bold text-lg">qetta</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              🆓 무료 체험
            </div>
            <button
              onClick={() => router.push('/premium/signup')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
              💎 Premium
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step === 'upload' ? 'text-indigo-500' : 'text-green-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                step === 'upload' ? 'border-indigo-500 bg-indigo-500/20' : 'border-green-500 bg-green-500/20'
              }`}>
                {step === 'upload' ? '1' : '✓'}
              </div>
              <span className="ml-2 font-medium">PDF 업로드</span>
            </div>

            <div className={`w-24 h-1 mx-4 ${step === 'processing' || step === 'result' ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>

            <div className={`flex items-center ${
              step === 'processing' ? 'text-indigo-500' : step === 'result' ? 'text-green-500' : 'text-gray-500'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                step === 'processing' ? 'border-indigo-500 bg-indigo-500/20' : 
                step === 'result' ? 'border-green-500 bg-green-500/20' : 
                'border-gray-700 bg-gray-800'
              }`}>
                {step === 'result' ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium">AI 분석</span>
            </div>

            <div className={`w-24 h-1 mx-4 ${step === 'result' ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>

            <div className={`flex items-center ${step === 'result' ? 'text-indigo-500' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                step === 'result' ? 'border-indigo-500 bg-indigo-500/20' : 'border-gray-700 bg-gray-800'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">결과 확인</span>
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                크레딧포유 PDF 업로드
              </h1>
              <p className="text-gray-400 text-lg">
                무료로 부채 상황을 확인하세요
              </p>
            </div>

            {/* Guide */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-400 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-bold mb-2">📱 크레딧포유 PDF 다운로드 방법</h3>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. 크레딧포유 앱 실행</li>
                    <li>2. "신용정보 조회" 메뉴 선택</li>
                    <li>3. "PDF로 저장" 버튼 클릭</li>
                    <li>4. 다운로드된 PDF를 여기에 업로드</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!file ? (
                <div>
                  <svg
                    className={`w-20 h-20 mx-auto mb-6 transition-colors ${
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
                  <p className="text-xl text-white font-medium mb-2">
                    {isDragging ? 'PDF를 놓으세요' : 'PDF를 드래그하거나 클릭하여 선택'}
                  </p>
                  <p className="text-gray-400">
                    크레딧포유 신용정보 PDF (최대 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-16 h-16 text-red-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-white font-medium text-lg">{file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                    className="ml-6 text-gray-400 hover:text-red-400 transition"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition"
              >
                뒤로가기
              </button>
              
              <button
                onClick={handleAnalyze}
                disabled={!file}
                className={`px-8 py-3 font-bold rounded-xl transition ${
                  file
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                무료 분석 시작하기 →
              </button>
            </div>

            {/* Info */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm mb-2">
                💡 무료 분석은 회원가입이 필요 없으며, 데이터는 24시간 후 자동 삭제됩니다
              </p>
              <p className="text-gray-500 text-sm">
                🔒 업로드된 파일은 암호화되어 안전하게 처리됩니다
              </p>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="max-w-xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                AI가 분석 중입니다...
              </h2>
              <p className="text-gray-400 mb-8">
                PDF에서 정보를 추출하고 최적의 방안을 찾고 있습니다
              </p>

              {/* Progress Bar */}
              <div className="bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-indigo-400 font-medium">{uploadProgress}%</p>
            </div>

            {/* Steps */}
            <div className="space-y-4 text-left">
              {[
                { label: 'PDF 업로드', done: uploadProgress > 20 },
                { label: 'OCR 정보 추출', done: uploadProgress > 40 },
                { label: '부채 데이터 분석', done: uploadProgress > 60 },
                { label: '최적 플랜 매칭', done: uploadProgress > 80 },
                { label: '결과 생성', done: uploadProgress >= 100 }
              ].map((item, idx) => (
                <div key={idx} className={`flex items-center p-4 rounded-lg transition-all ${
                  item.done ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    item.done ? 'bg-green-500' : 'bg-gray-700'
                  }`}>
                    {item.done ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className={item.done ? 'text-white' : 'text-gray-500'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
