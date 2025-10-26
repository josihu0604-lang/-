'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalysisHistory {
  id: string;
  createdAt: string;
  summary: {
    totalDebt: number;
    dti: number;
    creditScore: number;
    riskLevel: string;
  };
  status: string;
}

interface PDFHistory {
  id: string;
  filename: string;
  planType: string;
  status: string;
  createdAt: string;
  downloadUrl: string;
  analysisId: string;
}

interface UserProfile {
  email: string;
  name: string | null;
  phone: string | null;
  tier: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [pdfs, setPdfs] = useState<PDFHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analyses' | 'pdfs' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/premium/login');
        return;
      }

      // Fetch user profile (mock for now)
      setProfile({
        email: 'user@example.com',
        name: '홍길동',
        phone: '010-1234-5678',
        tier: 'PREMIUM',
        createdAt: new Date().toISOString()
      });

      // Fetch Premium analyses
      const analysisRes = await fetch('/api/v1/premium/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setAnalyses(analysisData.analyses || []);
      }

      // Fetch PDF history
      const pdfRes = await fetch('/api/v1/pdf/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (pdfRes.ok) {
        const pdfData = await pdfRes.json();
        setPdfs(pdfData.pdfs || []);
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-400 bg-green-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20';
      case 'CRITICAL': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW': return '낮음';
      case 'MEDIUM': return '보통';
      case 'HIGH': return '높음';
      case 'CRITICAL': return '매우 높음';
      default: return level;
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case 'SHINBOK_PRE_WORKOUT': return '신복위 프리워크아웃';
      case 'FRESH_START_FUND': return '새출발기금';
      case 'INDIVIDUAL_RECOVERY': return '개인회생';
      case 'INDIVIDUAL_BANKRUPTCY': return '개인파산';
      default: return planType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl font-semibold">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                대시보드
              </h1>
              <p className="text-gray-400">
                {profile?.name || profile?.email}님, 환영합니다
              </p>
            </div>
            <div className="flex items-center gap-4">
              {profile?.tier === 'PREMIUM' && (
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                  <span className="text-yellow-400 font-bold">⭐ PREMIUM</span>
                </div>
              )}
              <Link
                href="/"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              📊 개요
            </button>
            <button
              onClick={() => setActiveTab('analyses')}
              className={`py-4 px-2 border-b-2 font-semibold transition-all ${
                activeTab === 'analyses'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              📈 분석 내역
            </button>
            <button
              onClick={() => setActiveTab('pdfs')}
              className={`py-4 px-2 border-b-2 font-semibold transition-all ${
                activeTab === 'pdfs'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              📄 PDF 내역
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-2 border-b-2 font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              ⚙️ 설정
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">총 분석 횟수</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-white">{analyses.length}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">생성된 PDF</h3>
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-3xl font-bold text-white">{pdfs.length}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">회원 등급</h3>
                  <span className="text-2xl">{profile?.tier === 'PREMIUM' ? '⭐' : '🆓'}</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {profile?.tier === 'PREMIUM' ? 'PREMIUM' : 'FREE'}
                </p>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">최근 분석</h2>
              {analyses.length > 0 ? (
                <div className="space-y-3">
                  {analyses.slice(0, 3).map((analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/premium/result/${analysis.id}`}
                      className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskColor(analysis.summary.riskLevel)}`}>
                              위험도: {getRiskLabel(analysis.summary.riskLevel)}
                            </span>
                            <span className="text-gray-400 text-sm">
                              DTI: {analysis.summary.dti.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-white font-semibold">
                            총 부채: {formatCurrency(analysis.summary.totalDebt)}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                        <div className="text-cyan-400 text-xl">→</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-4">아직 분석 내역이 없습니다</p>
                  <Link
                    href="/premium/analyze"
                    className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
                  >
                    첫 분석 시작하기
                  </Link>
                </div>
              )}
            </div>

            {/* Recent PDFs */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">최근 생성된 PDF</h2>
              {pdfs.length > 0 ? (
                <div className="space-y-3">
                  {pdfs.slice(0, 3).map((pdf) => (
                    <div
                      key={pdf.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold mb-1">
                            {getPlanTypeLabel(pdf.planType)}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(pdf.createdAt)}
                          </p>
                        </div>
                        <a
                          href={pdf.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>아직 생성된 PDF가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyses Tab */}
        {activeTab === 'analyses' && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">전체 분석 내역</h2>
            {analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/premium/result/${analysis.id}`}
                    className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskColor(analysis.summary.riskLevel)}`}>
                            위험도: {getRiskLabel(analysis.summary.riskLevel)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            신용점수: {analysis.summary.creditScore}
                          </span>
                          <span className="text-gray-400 text-sm">
                            DTI: {analysis.summary.dti.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-white font-semibold">
                          총 부채: {formatCurrency(analysis.summary.totalDebt)}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {formatDate(analysis.createdAt)}
                        </p>
                      </div>
                      <div className="text-cyan-400 text-xl">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg mb-4">아직 분석 내역이 없습니다</p>
                <Link
                  href="/premium/analyze"
                  className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
                >
                  첫 분석 시작하기
                </Link>
              </div>
            )}
          </div>
        )}

        {/* PDFs Tab */}
        {activeTab === 'pdfs' && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">PDF 생성 내역</h2>
            {pdfs.length > 0 ? (
              <div className="space-y-3">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1">
                          {getPlanTypeLabel(pdf.planType)}
                        </p>
                        <p className="text-gray-400 text-sm mb-1">
                          파일명: {pdf.filename}
                        </p>
                        <p className="text-gray-400 text-sm">
                          생성일: {formatDate(pdf.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/premium/result/${pdf.analysisId}`}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/30 transition-all"
                        >
                          분석 보기
                        </Link>
                        <a
                          href={pdf.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg mb-4">아직 생성된 PDF가 없습니다</p>
                <p className="text-sm">Premium 분석 후 신청서 PDF를 생성할 수 있습니다</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">프로필 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">이메일</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">이름</label>
                  <input
                    type="text"
                    value={profile?.name || ''}
                    placeholder="이름을 입력하세요"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">전화번호</label>
                  <input
                    type="tel"
                    value={profile?.phone || ''}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
                  onClick={() => alert('프로필 업데이트 기능 구현 예정')}
                >
                  저장
                </button>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">구독 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                  <div>
                    <p className="text-white font-bold mb-1">
                      {profile?.tier === 'PREMIUM' ? '⭐ PREMIUM 회원' : '🆓 FREE 회원'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      가입일: {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
                    </p>
                  </div>
                  {profile?.tier === 'FREE' && (
                    <Link
                      href="/premium/pricing"
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all"
                    >
                      업그레이드
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">보안</h2>
              <div className="space-y-3">
                <button
                  onClick={() => alert('비밀번호 변경 기능 구현 예정')}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-left rounded-lg border border-white/10 transition-all"
                >
                  🔒 비밀번호 변경
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('accessToken');
                    router.push('/premium/login');
                  }}
                  className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-left rounded-lg border border-red-500/30 transition-all"
                >
                  🚪 로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
