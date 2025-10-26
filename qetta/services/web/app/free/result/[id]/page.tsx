'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FreeAnalysisResult {
  analysisId: string;
  createdAt: string;
  expiresAt: string;
  timeRemaining: number;
  summary: {
    totalDebt: number;
    monthlyPayment: number;
    estimatedIncome: number;
    dti: number;
    creditScore: number;
    creditGrade: string;
    riskLevel: string;
  };
  breakdown: {
    byType: {
      loans: { count: number; totalAmount: number; monthlyPayment: number };
      creditCards: { count: number; totalAmount: number; monthlyPayment: number };
      other: { count: number; totalAmount: number; monthlyPayment: number };
    };
  };
  recommendedPlan: {
    planName: string;
    planDescription: string;
    estimatedSavings: string;
    estimatedPeriod: string;
    benefits: string[];
    upgradeMessage: string;
  } | null;
  premiumFeatures: {
    available: string[];
    pricing: {
      basic: number;
      standard: number;
      premium: number;
    };
  };
  dataSource: {
    type: string;
    source: string;
    accuracy: string;
    note: string;
  };
}

export default function FreeResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  
  const [result, setResult] = useState<FreeAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [analysisId]);

  async function fetchResult() {
    try {
      const res = await fetch(`/api/v1/free/result/${analysisId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('분석 결과를 찾을 수 없습니다');
        } else if (res.status === 410) {
          setError('분석 결과가 만료되었습니다 (24시간 보관)');
        } else {
          setError('결과를 불러오는 중 오류가 발생했습니다');
        }
        return;
      }
      
      const data = await res.json();
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || '결과를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-gray-400';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">오류 발생</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/free/upload')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    );
  }

  const { summary, breakdown, recommendedPlan, premiumFeatures, dataSource, timeRemaining } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Header with expiry warning */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">무료 부채 분석 결과</h1>
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Expiry Timer */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div className="flex-1">
              <p className="text-orange-300 font-semibold">
                이 분석은 <span className="text-white">{Math.floor(timeRemaining / 60)}시간 {timeRemaining % 60}분</span> 후 자동 삭제됩니다
              </p>
              <p className="text-orange-200/70 text-sm mt-1">
                Premium으로 업그레이드하면 6개월간 보관되며 더 정확한 분석을 받을 수 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Warning */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-blue-300 font-semibold">{dataSource.source} OCR 분석 결과</p>
            <p className="text-blue-200/70 text-sm mt-1">{dataSource.note}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Debt */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">총 부채</p>
            <p className="text-3xl font-bold text-white mb-1">
              {formatCurrency(summary.totalDebt)}
            </p>
            <p className="text-gray-500 text-sm">
              월 상환액 {formatCurrency(summary.monthlyPayment)}
            </p>
          </div>

          {/* DTI */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">DTI (부채상환비율)</p>
            <p className="text-3xl font-bold text-cyan-400 mb-1">
              {summary.dti.toFixed(1)}%
            </p>
            <p className="text-gray-500 text-sm">
              추정 월소득 {formatCurrency(summary.estimatedIncome)}
            </p>
          </div>

          {/* Credit Score */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">신용등급</p>
            <p className="text-3xl font-bold text-white mb-1">
              {summary.creditGrade}
            </p>
            <p className="text-gray-500 text-sm">
              신용점수 {summary.creditScore}점
            </p>
          </div>
        </div>

        {/* Risk Level */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">위험도 평가</h2>
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-bold ${getRiskColor(summary.riskLevel)}`}>
              {getRiskLabel(summary.riskLevel)}
            </span>
            {summary.riskLevel === 'HIGH' || summary.riskLevel === 'CRITICAL' ? (
              <p className="text-gray-400">즉시 채무조정이 필요한 상태입니다</p>
            ) : summary.riskLevel === 'MEDIUM' ? (
              <p className="text-gray-400">채무 관리에 주의가 필요합니다</p>
            ) : (
              <p className="text-gray-400">건강한 재무 상태입니다</p>
            )}
          </div>
        </div>

        {/* Debt Breakdown */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">부채 구성</h2>
          <div className="space-y-4">
            {breakdown.byType.loans.count > 0 && (
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-semibold">대출</p>
                  <p className="text-gray-400 text-sm">{breakdown.byType.loans.count}건</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {formatCurrency(breakdown.byType.loans.totalAmount)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    월 {formatCurrency(breakdown.byType.loans.monthlyPayment)}
                  </p>
                </div>
              </div>
            )}
            
            {breakdown.byType.creditCards.count > 0 && (
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-semibold">신용카드</p>
                  <p className="text-gray-400 text-sm">{breakdown.byType.creditCards.count}건</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {formatCurrency(breakdown.byType.creditCards.totalAmount)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    월 {formatCurrency(breakdown.byType.creditCards.monthlyPayment)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Plan (Limited) */}
        {recommendedPlan && (
          <div className="mb-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">추천 플랜</h2>
                <p className="text-cyan-300 text-lg font-semibold">{recommendedPlan.planName}</p>
                <p className="text-gray-400 text-sm mt-1">{recommendedPlan.planDescription}</p>
              </div>
              <span className="text-3xl">💡</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">예상 절감액</p>
                <p className="text-2xl font-bold text-green-400">{recommendedPlan.estimatedSavings}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">예상 기간</p>
                <p className="text-2xl font-bold text-white">{recommendedPlan.estimatedPeriod}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">주요 혜택</p>
              <ul className="space-y-2">
                {recommendedPlan.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Blur overlay for premium features */}
            <div className="relative mt-4 p-4 bg-white/5 rounded-lg">
              <div className="blur-sm select-none">
                <p className="text-gray-400 text-sm mb-2">상세 분석 정보</p>
                <div className="space-y-2">
                  <p className="text-gray-500">• 월 상환액: ₩1,234,567</p>
                  <p className="text-gray-500">• 금리 인하율: 3.2%</p>
                  <p className="text-gray-500">• 승인 확률: 87%</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/50">
                  <p className="text-cyan-300 font-semibold text-center">
                    🔒 Premium 전용
                  </p>
                </div>
              </div>
            </div>

            <p className="text-orange-300 text-sm mt-4 text-center font-semibold">
              {recommendedPlan.upgradeMessage}
            </p>
          </div>
        )}

        {/* Premium Upgrade CTA */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-3">
            Premium으로 완성하세요
          </h2>
          <p className="text-white/90 text-lg mb-6">
            NICE API 실시간 데이터로 정확한 분석과 3가지 플랜 비교를 받아보세요
          </p>

          {/* Premium Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
            {premiumFeatures.available.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-white">{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="bg-white/10 rounded-lg px-6 py-3">
              <p className="text-white/70 text-sm">Basic</p>
              <p className="text-white text-2xl font-bold">
                ₩{premiumFeatures.pricing.basic.toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg px-6 py-3 border-2 border-white/50">
              <p className="text-white/70 text-sm">추천 ⭐</p>
              <p className="text-white text-2xl font-bold">
                ₩{premiumFeatures.pricing.standard.toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg px-6 py-3">
              <p className="text-white/70 text-sm">Premium</p>
              <p className="text-white text-2xl font-bold">
                ₩{premiumFeatures.pricing.premium.toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/premium/signup')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-xl shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Premium 시작하기 →
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-xl border border-white/30 hover:bg-white/20 transition-all"
            >
              홈으로 돌아가기
            </button>
          </div>

          <p className="text-white/70 text-sm mt-4">
            💳 카드/계좌이체 결제 가능 · 🔒 안전한 본인인증
          </p>
        </div>

      </div>
    </div>
  );
}
