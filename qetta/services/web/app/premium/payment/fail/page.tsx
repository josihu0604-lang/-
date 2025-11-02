'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // Map error codes to user-friendly messages
  const getErrorDetails = (code: string | null) => {
    const errorMap: Record<string, { title: string; description: string; icon: string }> = {
      'PAY_PROCESS_CANCELED': {
        title: '결제가 취소되었습니다',
        description: '사용자가 결제를 취소했습니다',
        icon: '🚫'
      },
      'PAY_PROCESS_ABORTED': {
        title: '결제가 중단되었습니다',
        description: '결제 처리 중 문제가 발생했습니다',
        icon: '⚠️'
      },
      'REJECT_CARD_COMPANY': {
        title: '카드사 승인 거부',
        description: '카드사에서 승인을 거부했습니다. 카드 한도를 확인해주세요',
        icon: '💳'
      },
      'INVALID_CARD_NUMBER': {
        title: '잘못된 카드 번호',
        description: '카드 번호를 다시 확인해주세요',
        icon: '❌'
      },
      'NOT_ENOUGH_BALANCE': {
        title: '잔액 부족',
        description: '계좌 잔액이 부족합니다',
        icon: '💰'
      },
      'EXCEED_MAX_AMOUNT': {
        title: '한도 초과',
        description: '1회 결제 한도를 초과했습니다',
        icon: '📊'
      }
    };

    return errorMap[code || ''] || {
      title: '결제 실패',
      description: errorMessage || '알 수 없는 오류가 발생했습니다',
      icon: '❌'
    };
  };

  const errorDetails = getErrorDetails(errorCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full mb-6">
            <span className="text-5xl">{errorDetails.icon}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {errorDetails.title}
          </h1>
          <p className="text-gray-400 text-lg">
            {errorDetails.description}
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">오류 상세 정보</h2>
          
          <div className="space-y-3">
            {orderId && (
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">주문번호</span>
                <span className="text-white font-mono text-sm">{orderId}</span>
              </div>
            )}
            
            {errorCode && (
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">오류 코드</span>
                <span className="text-red-400 font-mono text-sm">{errorCode}</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="py-3">
                <span className="text-gray-400 block mb-2">상세 메시지</span>
                <span className="text-white text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">
            💡 문제 해결 방법
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>카드 한도와 잔액을 확인해주세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>카드 번호, 유효기간, CVC를 정확히 입력했는지 확인해주세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>다른 카드로 시도해보세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>계좌이체로 결제 방법을 변경해보세요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>문제가 계속되면 카드사에 문의해주세요</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => router.push('/premium/payment')}
            className="flex-1 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105"
          >
            다시 시도하기
          </button>
          <button
            onClick={() => router.push('/premium/signup')}
            className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/30 transition-all"
          >
            플랜 변경하기
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
          >
            홈으로 돌아가기
          </button>
          <button
            onClick={() => router.push('/free/upload')}
            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
          >
            무료 분석 이용하기
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">
            결제 관련 문의가 있으신가요?
          </p>
          <p className="text-gray-500 text-sm">
            고객센터: <a href="mailto:support@qetta.kr" className="text-cyan-400 hover:text-cyan-300">support@qetta.kr</a>
            {' • '}
            카카오톡: <a href="https://pf.kakao.com/_qetta" className="text-cyan-400 hover:text-cyan-300">@qetta</a>
          </p>
        </div>
      </div>
    </div>
  );
}
