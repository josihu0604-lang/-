'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SignupStep = 'info' | 'phone' | 'plan' | 'payment';

interface UserInfo {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19000,
    features: [
      'NICE API 실시간 신용정보',
      '3가지 플랜 상세 비교',
      '신청서 PDF 자동 생성',
      '30일 데이터 보관'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 24000,
    popular: true,
    features: [
      'Basic 모든 기능 포함',
      'AI 승인 확률 예측',
      '90일 데이터 보관',
      '이메일 상담 지원'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29000,
    features: [
      'Standard 모든 기능 포함',
      '180일 데이터 보관',
      'KakaoTalk 1:1 전문가 상담',
      '우선 처리 서비스'
    ]
  }
];

export default function PremiumSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('info');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: ''
  });
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: User Info
  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!userInfo.email || !userInfo.password || !userInfo.name) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (userInfo.password !== userInfo.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (userInfo.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setStep('phone');
  }

  // Step 2: Phone Verification
  async function handlePhoneVerification() {
    setLoading(true);
    setError(null);

    try {
      // In production, this would call NICE API
      // For now, simulate verification
      const res = await fetch('/api/v1/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userInfo.phone })
      });

      if (!res.ok) {
        throw new Error('인증번호 전송 실패');
      }

      alert('인증번호가 전송되었습니다');
    } catch (err: any) {
      setError(err.message || '인증번호 전송 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setLoading(true);
    setError(null);

    try {
      // Verify code
      const res = await fetch('/api/v1/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: userInfo.phone, 
          code: verificationCode 
        })
      });

      if (!res.ok) {
        throw new Error('인증번호가 올바르지 않습니다');
      }

      setPhoneVerified(true);
      setStep('plan');
    } catch (err: any) {
      setError(err.message || '인증 실패');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Plan Selection → Payment
  function handlePlanSelect(planId: string) {
    setSelectedPlan(planId);
  }

  async function handleProceedToPayment() {
    setLoading(true);
    setError(null);

    try {
      // Create user account
      const signupRes = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          password: userInfo.password,
          name: userInfo.name,
          phone: userInfo.phone,
          plan: selectedPlan
        })
      });

      if (!signupRes.ok) {
        throw new Error('회원가입에 실패했습니다');
      }

      const { userId } = await signupRes.json();

      // Redirect to payment page
      const plan = PLANS.find(p => p.id === selectedPlan);
      router.push(`/premium/payment?userId=${userId}&plan=${selectedPlan}&amount=${plan?.price}`);

    } catch (err: any) {
      setError(err.message || '가입 처리 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#111827] to-[#0B0F14] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Premium 가입하기
          </h1>
          <p className="text-gray-400">
            정확한 분석과 전문가 상담을 받아보세요
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'info' ? 'text-cyan-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'info' ? 'bg-cyan-500 text-white' : 'bg-gray-700'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">정보 입력</span>
          </div>
          <div className="w-12 h-px bg-gray-700"></div>
          <div className={`flex items-center gap-2 ${step === 'phone' ? 'text-cyan-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'phone' ? 'bg-cyan-500 text-white' : 'bg-gray-700'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">본인인증</span>
          </div>
          <div className="w-12 h-px bg-gray-700"></div>
          <div className={`flex items-center gap-2 ${step === 'plan' ? 'text-cyan-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'plan' ? 'bg-cyan-500 text-white' : 'bg-gray-700'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">플랜 선택</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400">⚠️</span>
              <p className="text-red-300 flex-1">{error}</p>
            </div>
          )}

          {/* Step 1: User Info */}
          {step === 'info' && (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">이름</label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="홍길동"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">이메일</label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">비밀번호</label>
                <input
                  type="password"
                  value={userInfo.password}
                  onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="8자 이상"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">비밀번호 확인</label>
                <input
                  type="password"
                  value={userInfo.passwordConfirm}
                  onChange={(e) => setUserInfo({ ...userInfo, passwordConfirm: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
              >
                다음 단계
              </button>
            </form>
          )}

          {/* Step 2: Phone Verification */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">휴대폰 번호</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    placeholder="010-1234-5678"
                    required
                  />
                  <button
                    onClick={handlePhoneVerification}
                    disabled={loading || !userInfo.phone}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '전송중...' : '인증번호 받기'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">인증번호</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="6자리 숫자"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || !verificationCode || verificationCode.length !== 6}
                className="w-full px-6 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '확인중...' : '인증 완료'}
              </button>

              <button
                onClick={() => setStep('info')}
                className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
              >
                이전 단계
              </button>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 'plan' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white text-center mb-4">
                플랜을 선택하세요
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`relative p-6 rounded-xl cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'bg-cyan-500/20 border-2 border-cyan-500'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        인기 ⭐
                      </div>
                    )}

                    <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
                    <p className="text-3xl font-bold text-cyan-400 mb-4">
                      ₩{plan.price.toLocaleString('ko-KR')}
                    </p>

                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-cyan-400">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.id && (
                      <div className="mt-4 text-center text-cyan-400 font-semibold">
                        선택됨 ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '처리중...' : '결제하기'}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-all"
              >
                이전 단계
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => router.push('/premium/login')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
