'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PremiumAnalyzePage() {
  const router = useRouter();
  
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!monthlyIncome || !phone) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (!agreedToTerms) {
      setError('신용정보 조회에 동의해주세요');
      return;
    }

    const incomeValue = parseInt(monthlyIncome.replace(/,/g, ''));
    if (incomeValue < 500000) {
      setError('월 소득은 최소 ₩500,000 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      // Get access token (from localStorage or context)
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/premium/login?redirect=/premium/analyze');
        return;
      }

      // Call Premium analysis API
      const res = await fetch('/api/v1/premium/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monthlyIncome: incomeValue,
          phone: phone.replace(/-/g, '')
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/premium/login?redirect=/premium/analyze');
          return;
        }
        if (res.status === 403) {
          throw new Error('Premium 구독이 필요합니다');
        }
        throw new Error('분석 요청에 실패했습니다');
      }

      const data = await res.json();

      // Redirect to result page
      router.push(`/premium/result/${data.analysisId}`);

    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: string) {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function handleIncomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value);
    setMonthlyIncome(formatted);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Premium 부채 분석
          </h1>
          <p className="text-gray-400 text-lg">
            NICE API로 정확한 신용정보를 조회하고<br />
            3가지 맞춤 플랜을 받아보세요
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🔒', title: 'NICE API', desc: '실시간 정확한 신용정보' },
            { icon: '📋', title: '3가지 플랜', desc: '상세 비교 분석' },
            { icon: '🤖', title: 'AI 예측', desc: '승인 확률 계산' }
          ].map((feature, idx) => (
            <div key={idx} className="card p-4 text-center">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <p className="text-white font-semibold mb-1">{feature.title}</p>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Main Form Card */}
        <div className="card p-8 mb-6">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400">⚠️</span>
              <p className="text-red-300 flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-6">
            
            {/* Monthly Income */}
            <div>
              <label className="block text-white font-semibold mb-2">
                월 소득 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  ₩
                </span>
                <input
                  type="text"
                  value={monthlyIncome}
                  onChange={handleIncomeChange}
                  className="input pl-10 text-lg"
                  placeholder="3,000,000"
                  required
                />
              </div>
              <p className="text-gray-500 text-sm mt-2">
                💡 정확한 월 평균 소득을 입력해주세요 (세전 금액)
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-white font-semibold mb-2">
                휴대폰 번호 <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input text-lg"
                placeholder="010-1234-5678"
                required
              />
              <p className="text-gray-500 text-sm mt-2">
                🔒 NICE API 본인인증 및 신용정보 조회에 사용됩니다
              </p>
            </div>

            {/* NICE API Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-blue-300 font-semibold mb-2">
                    NICE API 신용정보 조회 안내
                  </p>
                  <ul className="text-blue-200/80 text-sm space-y-1">
                    <li>• 본인인증 후 실시간으로 신용정보를 조회합니다</li>
                    <li>• 대출, 신용카드, 금리 등 정확한 정보를 수집합니다</li>
                    <li>• 조회 이력이 신용점수에 영향을 주지 않습니다</li>
                    <li>• 모든 정보는 암호화되어 안전하게 보관됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-brand-primary focus:ring-2 focus:ring-brand-primary"
                  required
                />
                <span className="text-gray-300 text-sm flex-1">
                  <span className="text-white font-semibold">(필수)</span> NICE API를 통한 신용정보 조회 및 이용에 동의합니다
                </span>
              </label>
              
              <div className="pl-8 space-y-1 text-gray-500 text-xs">
                <p>• 개인정보 수집 및 이용 동의</p>
                <p>• 신용정보 조회 동의 (NICE평가정보)</p>
                <p>• 제3자 정보제공 동의</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="btn-primary w-full px-8 py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  분석 중...
                </span>
              ) : (
                '정밀 분석 시작하기 →'
              )}
            </button>
          </form>
        </div>

        {/* Processing Time Notice */}
        <div className="card p-4 text-center">
          <p className="text-gray-400 text-sm">
            ⏱️ 분석은 약 <span className="text-white font-semibold">30초</span> 소요됩니다
            (NICE API 조회 + AI 분석)
          </p>
        </div>

        {/* Benefits Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-sev-success/10 to-brand-primary/10 border border-sev-success/30 rounded-xl p-4">
            <p className="text-green-400 font-semibold mb-2">✓ Premium 혜택</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• 실시간 정확한 신용정보</li>
              <li>• 3가지 플랜 상세 비교</li>
              <li>• 신청서 PDF 자동 생성</li>
              <li>• AI 승인 확률 예측</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-400 font-semibold mb-2">🔒 보안</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• AES-256 암호화</li>
              <li>• NICE API 공식 파트너</li>
              <li>• 6개월 안전 보관</li>
              <li>• 금융보안 인증 완료</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
