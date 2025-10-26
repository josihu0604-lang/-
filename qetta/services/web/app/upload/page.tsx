/**
 * Upload Page - Account Selection & File Upload
 * 
 * Allows users to:
 * 1. Select bank accounts from connected OAuth providers
 * 2. Upload additional documents (CSV, PDF, Excel)
 * 3. Trigger debt analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccountSelector from '@/components/upload/AccountSelector';
import FileDropzone from '@/components/upload/FileDropzone';
import SyncButton from '@/components/upload/SyncButton';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  provider: string;
  lastSyncedAt: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  file: File;
}

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [creditScore, setCreditScore] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bank accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/accounts', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to load accounts');
      }

      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('계좌 정보를 불러오는데 실패했습니다. OAuth 연동을 먼저 완료해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/accounts/sync', {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Sync failed');
      }

      await loadAccounts();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('계좌 동기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileAdd(newFiles: File[]) {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      file
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  }

  function handleFileRemove(fileName: string) {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  }

  function handleAccountToggle(accountId: string) {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  }

  function handleSelectAll() {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map(a => a.id));
    }
  }

  async function handleAnalyze() {
    if (selectedAccounts.length === 0) {
      setError('분석할 계좌를 선택해주세요.');
      return;
    }

    if (!monthlyIncome) {
      setError('월 소득을 입력해주세요.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      // Start analysis
      const res = await fetch('/api/v1/debt/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          monthlyIncome: parseFloat(monthlyIncome.replace(/,/g, '')),
          creditScore: creditScore ? parseInt(creditScore) : undefined,
          otherDebts: [] // Could be populated from uploaded files
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const data = await res.json();
      
      // Redirect to result page
      router.push(data.redirectUrl || `/result/${data.analysisId}`);

    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || '분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = selectedAccounts.length > 0 && monthlyIncome && !analyzing;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            부채 분석 시작하기
          </h1>
          <p className="text-gray-400 text-lg">
            연동된 계좌를 선택하고 추가 정보를 입력하여 맞춤형 채무조정 방안을 확인하세요
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-400 font-medium">오류</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Account Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Selector */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">계좌 선택</h2>
                <SyncButton onSync={handleSync} loading={loading} />
              </div>
              
              <AccountSelector
                accounts={accounts}
                selectedAccounts={selectedAccounts}
                onToggle={handleAccountToggle}
                onSelectAll={handleSelectAll}
                loading={loading}
              />
            </div>

            {/* File Upload (Optional) */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">추가 서류 업로드</h2>
              <p className="text-gray-400 text-sm mb-4">
                급여명세서, 신용카드 명세서 등의 추가 서류를 업로드하여 더 정확한 분석을 받으세요 (선택사항)
              </p>
              
              <FileDropzone
                files={files}
                onAdd={handleFileAdd}
                onRemove={handleFileRemove}
              />
            </div>
          </div>

          {/* Right Column: Income & Analysis */}
          <div className="space-y-6">
            
            {/* Income Input */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    월 소득 (필수) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={monthlyIncome}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setMonthlyIncome(value ? parseInt(value).toLocaleString() : '');
                      }}
                      placeholder="3,000,000"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-4 top-3 text-gray-400">원</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">세전 월 급여 기준</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    신용점수 (선택)
                  </label>
                  <input
                    type="text"
                    value={creditScore}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (!value || (parseInt(value) >= 0 && parseInt(value) <= 1000)) {
                        setCreditScore(value);
                      }
                    }}
                    placeholder="750"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">300~1000 사이 (NICE 기준)</p>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-indigo-500/30">
              <h3 className="text-lg font-bold text-white mb-3">선택 요약</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">선택된 계좌</span>
                  <span className="text-white font-medium">{selectedAccounts.length}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">업로드된 파일</span>
                  <span className="text-white font-medium">{files.length}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">월 소득</span>
                  <span className="text-white font-medium">
                    {monthlyIncome ? `${monthlyIncome}원` : '-'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                  canAnalyze
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                {analyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    분석 중...
                  </span>
                ) : (
                  '부채 분석 시작하기'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                분석은 약 1-2분 소요됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
