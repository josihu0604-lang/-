'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    confirmPayment();
  }, []);

  async function confirmPayment() {
    try {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        throw new Error('결제 정보가 올바르지 않습니다');
      }

      // Confirm payment with backend
      const res = await fetch('/api/v1/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '결제 승인에 실패했습니다');
      }

      const data = await res.json();
      setPaymentInfo(data);

    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setError(err.message || '결제 처리 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl font-semibold mb-2">결제를 처리하고 있습니다...</p>
          <p className="text-gray-400">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">결제 실패</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/premium/payment')}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full mb-6 animate-bounce">
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            결제가 완료되었습니다!
          </h1>
          <p className="text-gray-400 text-lg">
            qetta Premium을 시작하세요
          </p>
        </div>

        {/* Payment Info Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">결제 정보</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">주문번호</span>
              <span className="text-white font-mono text-sm">{paymentInfo?.orderId}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">결제 금액</span>
              <span className="text-white font-bold text-xl">
                ₩{searchParams.get('amount')?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">결제 방법</span>
              <span className="text-white">신용카드 / 계좌이체</span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-400">결제 상태</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                승인 완료
              </span>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">
            🎉 Premium 회원이 되신 것을 환영합니다!
          </h3>
          <p className="text-gray-300 mb-4">
            이제 다음과 같은 프리미엄 기능을 사용하실 수 있습니다:
          </p>
          <ul className="space-y-2">
            {[
              'NICE API 실시간 정확한 신용정보',
              '3가지 플랜 상세 비교 분석',
              '신청서 PDF 자동 생성',
              'AI 승인 확률 예측',
              '전문가 1:1 상담',
              '데이터 6개월 보관'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-gray-300">
                <span className="text-cyan-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/premium/analyze')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105"
          >
            부채 분석 시작하기 →
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/30 transition-all"
          >
            대시보드로 이동
          </button>
        </div>

        {/* Receipt Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">
            영수증은 가입하신 이메일로 전송되었습니다
          </p>
          <p className="text-gray-500 text-sm">
            문의사항: <a href="mailto:support@qetta.kr" className="text-cyan-400 hover:text-cyan-300">support@qetta.kr</a>
          </p>
        </div>
      </div>
    </div>
  );
}
