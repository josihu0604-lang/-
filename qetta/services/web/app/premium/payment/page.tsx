'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    TossPayments: any;
  }
}

const PLAN_DETAILS: Record<string, { name: string; features: string[] }> = {
  basic: {
    name: 'Basic',
    features: [
      'NICE API 실시간 신용정보',
      '3가지 플랜 상세 비교',
      '신청서 PDF 자동 생성',
      '30일 데이터 보관'
    ]
  },
  standard: {
    name: 'Standard ⭐',
    features: [
      'Basic 모든 기능',
      'AI 승인 확률 예측',
      '90일 데이터 보관',
      '이메일 상담 지원'
    ]
  },
  premium: {
    name: 'Premium',
    features: [
      'Standard 모든 기능',
      '180일 데이터 보관',
      'KakaoTalk 1:1 전문가 상담',
      '우선 처리 서비스'
    ]
  }
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const userId = searchParams.get('userId');
  const plan = searchParams.get('plan') as string;
  const amount = parseInt(searchParams.get('amount') || '0');
  
  const [tossReady, setTossReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !plan || !amount) {
      setError('결제 정보가 올바르지 않습니다');
    }
  }, [userId, plan, amount]);

  function handleTossLoad() {
    setTossReady(true);
  }

  async function handlePayment(method: 'CARD' | 'TRANSFER') {
    if (!userId || !plan) {
      setError('결제 정보가 올바르지 않습니다');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment order
      const orderRes = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan,
          amount,
          method
        })
      });

      if (!orderRes.ok) {
        throw new Error('주문 생성에 실패했습니다');
      }

      const { orderId, orderName } = await orderRes.json();

      // Initialize Toss Payments
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_TEST_CLIENT_KEY';
      const tossPayments = window.TossPayments(clientKey);

      // Request payment
      await tossPayments.requestPayment(method === 'CARD' ? '카드' : '계좌이체', {
        amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/premium/payment/success`,
        failUrl: `${window.location.origin}/premium/payment/fail`,
        customerName: '고객',
        customerEmail: 'customer@qetta.kr'
      });

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '결제 요청 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.standard;

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1"
        onLoad={handleTossLoad}
        strategy="afterInteractive"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              결제하기
            </h1>
            <p className="text-gray-400">
              안전한 결제를 위해 Toss Payments를 이용합니다
            </p>
          </div>

          {/* Main Content Card */}
          <div className="card p-8">
            
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-red-400">⚠️</span>
                <p className="text-red-300 flex-1">{error}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">주문 내역</h2>
              
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-white mb-1">
                      qetta Premium - {planInfo.name}
                    </p>
                    <p className="text-gray-400 text-sm">1개월 이용권</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-primary">
                      ₩{amount.toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-gray-400 text-sm mb-2">포함된 기능</p>
                  <ul className="space-y-2">
                    {planInfo.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-brand-primary">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">결제 수단</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Payment */}
                <button
                  onClick={() => handlePayment('CARD')}
                  disabled={loading || !tossReady}
                  className="card-interactive p-6 hover:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-3">💳</div>
                  <p className="text-white font-bold mb-1">신용/체크카드</p>
                  <p className="text-gray-400 text-sm">모든 카드사 사용 가능</p>
                </button>

                {/* Bank Transfer */}
                <button
                  onClick={() => handlePayment('TRANSFER')}
                  disabled={loading || !tossReady}
                  className="card-interactive p-6 hover:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-3">🏦</div>
                  <p className="text-white font-bold mb-1">계좌이체</p>
                  <p className="text-gray-400 text-sm">실시간 계좌이체</p>
                </button>
              </div>

              {loading && (
                <div className="mt-4 text-center">
                  <div className="spinner w-8 h-8 mb-2"></div>
                  <p className="text-gray-400 text-sm">결제 페이지로 이동 중...</p>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-white">총 결제 금액</p>
                <p className="text-3xl font-bold text-brand-primary">
                  ₩{amount.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1" required />
                <span className="text-gray-400 text-sm">
                  <span className="text-white font-semibold">(필수)</span> 서비스 이용약관에 동의합니다
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1" required />
                <span className="text-gray-400 text-sm">
                  <span className="text-white font-semibold">(필수)</span> 개인정보 처리방침에 동의합니다
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1" required />
                <span className="text-gray-400 text-sm">
                  <span className="text-white font-semibold">(필수)</span> 전자금융거래 이용약관에 동의합니다
                </span>
              </label>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <p className="text-blue-300 font-semibold mb-1">안전한 결제</p>
                <p className="text-blue-200/70 text-sm">
                  Toss Payments의 PCI DSS Level 1 인증을 받은 보안 시스템을 사용합니다.
                  카드 정보는 암호화되어 안전하게 처리됩니다.
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => router.push('/premium/signup')}
              className="w-full mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
            >
              취소
            </button>
          </div>

          {/* Support */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              결제 관련 문의:{' '}
              <a href="mailto:support@qetta.kr" className="text-brand-primary hover:text-brand-primary-hover">
                support@qetta.kr
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
