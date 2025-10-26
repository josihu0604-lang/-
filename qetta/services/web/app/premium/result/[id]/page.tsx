'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Plan {
  id: string;
  planName: string;
  planDescription: string;
  adjustedPayment: number;
  adjustedInterestRate: number;
  estimatedPeriod: number;
  totalSavings: number;
  debtReductionRate: number;
  pros: string[];
  cons: string[];
  isRecommended: boolean;
  approvalProbability?: number;
}

interface AnalysisResult {
  analysisId: string;
  analyzedAt: string;
  summary: {
    totalDebt: number;
    monthlyPayment: number;
    monthlyIncome: number;
    dti: number;
    creditScore: number;
    creditGrade: string;
    riskLevel: string;
  };
  breakdown: any;
  plans: Plan[];
}

export default function PremiumResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [analysisId]);

  async function fetchResult() {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/premium/login');
        return;
      }

      const res = await fetch(`/api/v1/premium/result/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/premium/login');
          return;
        }
        throw new Error('결과를 불러올 수 없습니다');
      }

      const data = await res.json();
      setResult(data);
      
      // Auto-select recommended plan
      const recommended = data.plans.find((p: Plan) => p.isRecommended);
      if (recommended) {
        setSelectedPlanId(recommended.id);
      }

    } catch (err: any) {
      setError(err.message || '결과 조회 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
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

  const getApprovalColor = (probability: number) => {
    if (probability >= 80) return 'text-green-400';
    if (probability >= 60) return 'text-cyan-400';
    if (probability >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  async function handleGeneratePDF() {
    if (!selectedPlanId) {
      alert('플랜을 먼저 선택해주세요');
      return;
    }

    setGeneratingPDF(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/premium/login');
        return;
      }

      const selectedPlan = result?.plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('선택된 플랜을 찾을 수 없습니다');
      }

      // Map plan IDs to plan types
      const planTypeMap: Record<string, string> = {
        '1': 'SHINBOK_PRE_WORKOUT',
        '2': 'FRESH_START_FUND',
        '3': 'INDIVIDUAL_RECOVERY'
      };

      const planType = planTypeMap[selectedPlan.id] || 'SHINBOK_PRE_WORKOUT';

      const res = await fetch('/api/v1/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysisId: analysisId,
          planType: planType
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'PDF 생성에 실패했습니다');
      }

      const data = await res.json();
      
      // Download PDF
      const downloadUrl = data.pdfUrl;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ PDF가 성공적으로 생성되었습니다!');

    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(err.message || 'PDF 생성 중 오류가 발생했습니다');
    } finally {
      setGeneratingPDF(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl font-semibold">분석 결과를 불러오는 중...</p>
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
            onClick={() => router.push('/premium/analyze')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    );
  }

  const { summary, plans } = result;
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Premium 분석 완료
          </h1>
          <p className="text-gray-400 text-lg">
            NICE API 실시간 데이터 기반 정밀 분석 결과입니다
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">총 부채</p>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(summary.totalDebt)}
            </p>
            <p className="text-gray-500 text-sm">
              월 {formatCurrency(summary.monthlyPayment)}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">DTI</p>
            <p className="text-2xl font-bold text-cyan-400 mb-1">
              {summary.dti.toFixed(1)}%
            </p>
            <p className="text-gray-500 text-sm">
              부채상환비율
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">신용등급</p>
            <p className="text-2xl font-bold text-white mb-1">
              {summary.creditGrade}
            </p>
            <p className="text-gray-500 text-sm">
              {summary.creditScore}점
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">위험도</p>
            <p className={`text-2xl font-bold mb-1 ${getRiskColor(summary.riskLevel)}`}>
              {getRiskLabel(summary.riskLevel)}
            </p>
            <p className="text-gray-500 text-sm">
              재무 상태
            </p>
          </div>
        </div>

        {/* Plan Selection Tabs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            맞춤 채무조정 플랜 ({plans.length}개)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-6 rounded-xl text-left transition-all ${
                  selectedPlanId === plan.id
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    추천 ⭐
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">플랜 {idx + 1}</p>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {plan.planName}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">월 상환액</span>
                    <span className="text-cyan-400 font-bold">
                      {formatCurrency(plan.adjustedPayment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">절감액</span>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(plan.totalSavings)}
                    </span>
                  </div>
                </div>

                {selectedPlanId === plan.id && (
                  <div className="text-center text-cyan-400 font-semibold text-sm">
                    선택됨 ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Plan Details */}
        {selectedPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Left: Plan Overview */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Plan Info */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">
                  {selectedPlan.planName}
                </h3>
                <p className="text-gray-300 mb-6">
                  {selectedPlan.planDescription}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">월 상환액</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {formatCurrency(selectedPlan.adjustedPayment)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">금리</p>
                    <p className="text-lg font-bold text-white">
                      {selectedPlan.adjustedInterestRate}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">상환기간</p>
                    <p className="text-lg font-bold text-white">
                      {selectedPlan.estimatedPeriod}개월
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">감면율</p>
                    <p className="text-lg font-bold text-green-400">
                      {selectedPlan.debtReductionRate}%
                    </p>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm mb-1">총 절감 예상액</p>
                      <p className="text-3xl font-bold text-green-400">
                        {formatCurrency(selectedPlan.totalSavings)}
                      </p>
                    </div>
                    <div className="text-5xl">💰</div>
                  </div>
                  <p className="text-gray-400 text-sm mt-3">
                    기존 상환 방식 대비 약 {formatCurrency(summary.monthlyPayment - selectedPlan.adjustedPayment)}/월 절감
                  </p>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-400 font-semibold mb-3">✓ 장점</p>
                    <ul className="space-y-2">
                      {selectedPlan.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                          <span className="text-green-400 mt-0.5">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-orange-400 font-semibold mb-3">⚠ 단점</p>
                    <ul className="space-y-2">
                      {selectedPlan.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                          <span className="text-orange-400 mt-0.5">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  현재 vs 조정 후 비교
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">월 상환액</span>
                      <span className="text-gray-400 text-sm">
                        {formatCurrency(summary.monthlyPayment)} → {formatCurrency(selectedPlan.adjustedPayment)}
                      </span>
                    </div>
                    <div className="relative h-8 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: '100%' }}
                      ></div>
                      <div 
                        className="absolute h-full bg-gradient-to-r from-green-500 to-cyan-500"
                        style={{ width: `${(selectedPlan.adjustedPayment / summary.monthlyPayment) * 100}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                        {Math.round((1 - selectedPlan.adjustedPayment / summary.monthlyPayment) * 100)}% 감소
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="space-y-6">
              
              {/* Approval Probability */}
              {selectedPlan.approvalProbability !== undefined && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                  <p className="text-gray-300 text-sm mb-2">AI 승인 확률 예측</p>
                  <div className="flex items-end gap-2 mb-3">
                    <p className={`text-4xl font-bold ${getApprovalColor(selectedPlan.approvalProbability)}`}>
                      {selectedPlan.approvalProbability}%
                    </p>
                    <p className="text-gray-400 text-sm mb-2">승인 가능성</p>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        selectedPlan.approvalProbability >= 80 ? 'bg-gradient-to-r from-green-400 to-cyan-400' :
                        selectedPlan.approvalProbability >= 60 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                        selectedPlan.approvalProbability >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        'bg-gradient-to-r from-orange-400 to-red-400'
                      }`}
                      style={{ width: `${selectedPlan.approvalProbability}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {selectedPlan.approvalProbability >= 70 ? '높은 승인 가능성' :
                     selectedPlan.approvalProbability >= 50 ? '보통 승인 가능성' :
                     '추가 서류 필요 가능'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">다음 단계</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF || !selectedPlanId}
                    className={`w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all ${
                      generatingPDF || !selectedPlanId
                        ? 'opacity-50 cursor-not-allowed'
                        : 'transform hover:scale-105'
                    }`}
                  >
                    {generatingPDF ? '📄 생성 중...' : '📄 신청서 PDF 생성'}
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all"
                  >
                    📊 대시보드로 이동
                  </button>
                  <button
                    onClick={() => alert('1:1 상담 예약 기능 구현 예정')}
                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all"
                  >
                    💬 전문가 상담 예약
                  </button>
                </div>
              </div>

              {/* Data Source */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <span className="text-xl">🔒</span>
                  <div className="flex-1">
                    <p className="text-blue-300 font-semibold text-sm mb-1">
                      NICE API 실시간 데이터
                    </p>
                    <p className="text-blue-200/70 text-xs">
                      분석일시: {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">💡 안내사항</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• 분석 결과는 6개월간 안전하게 보관됩니다</li>
            <li>• 신청서 PDF는 언제든지 다운로드 가능합니다</li>
            <li>• 승인 확률은 AI 예측이며 실제 결과와 다를 수 있습니다</li>
            <li>• 추가 상담이 필요하면 1:1 전문가 상담을 이용하세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
