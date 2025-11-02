/**
 * qetta Landing Page - Free Tier Entry Point
 * 
 * Freemium 전략:
 * - 무료 PDF 분석 강조
 * - 회원가입 불필요
 * - Premium 전환 유도
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');

  return (
    <main className="min-h-screen bg-bg">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"></div>
        
        <div className="container mx-auto px-4 py-16 relative">
          
          {/* Header */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg mr-3"></div>
              <h1 className="text-2xl font-bold text-white">qetta</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="#how-it-works" className="link text-fg-muted hover:text-fg">
                이용방법
              </a>
              <a href="#pricing" className="link text-fg-muted hover:text-fg">
                요금
              </a>
              <button 
                onClick={() => router.push('/free/upload')}
                className="btn btn-secondary btn-sm"
              >
                로그인
              </button>
            </div>
          </nav>

          {/* Main Hero */}
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="badge badge-primary mb-6 animate-fade-in">
              🎉 오늘만 특별가: Premium ₩29,000 → ₩19,000 (33% 할인)
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              5분 만에<br />
              <span className="gradient-text">
                부채 조정 가능 확인
              </span>
            </h2>
            
            <p className="text-xl text-fg-muted mb-8 animate-slide-up">
              AI가 당신의 부채를 분석하고, 최적의 채무조정 방안을 제시합니다.<br />
              신복위 프리워크아웃부터 새출발기금까지, 맞춤형 솔루션을 즉시 확인하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => router.push('/free/upload')}
                className="btn btn-primary btn-lg w-full sm:w-auto text-lg transform hover:scale-105 animate-fade-in"
              >
                🆓 무료로 먼저 확인하기
              </button>
              
              <button
                onClick={() => router.push('/premium/signup')}
                className="btn btn-secondary btn-lg w-full sm:w-auto text-lg animate-fade-in"
              >
                💎 Premium 바로 시작
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-fg-muted text-sm animate-slide-up">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                회원가입 불필요
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                크레딧포유 PDF만 OK
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                이미 243명 성공
              </div>
              <div className="flex items-center">
                ⭐⭐⭐⭐⭐ <span className="ml-2">4.8/5.0</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="max-w-4xl mx-auto">
            <div className="relative card p-8 shadow-2xl animate-slide-up">
              <div className="absolute -top-4 -right-4 badge badge-success text-sm font-bold shadow-lg">
                평균 ₩120만원/월 절감
              </div>
              
              {/* Mock Result Preview */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card bg-sev-crit/10 border-sev-crit/30 p-6">
                  <div className="text-sm text-fg-muted mb-2">현재</div>
                  <div className="text-3xl font-bold text-fg mb-1">₩2.1M</div>
                  <div className="text-error text-sm">월 상환액</div>
                </div>
                
                <div className="card bg-sev-success/10 border-sev-success/30 p-6">
                  <div className="text-sm text-gray-400 mb-2">조정 후</div>
                  <div className="text-3xl font-bold text-white mb-1">₩900K</div>
                  <div className="text-success text-sm">월 상환액 (-57%)</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center text-fg-muted text-sm">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                실제 사례 기반 (2024년 12월)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section className="py-20 bg-bg-elev/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-fg text-center mb-12">
            이런 분들을 위한 서비스
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: '💳', title: '여러 곳에 대출/카드빚', desc: '은행, 저축은행, 카드사 등 여러 곳에서 빌린 돈' },
              { icon: '😰', title: '월 상환 부담이 큼', desc: '월급의 절반 이상이 이자와 원금 상환으로' },
              { icon: '❓', title: '신복위가 뭔지 모름', desc: '채무조정, 프리워크아웃, 개인회생... 뭐가 맞는지 모르겠음' },
              { icon: '💰', title: '법무사 비용 부담', desc: '법무사 상담비 30만원이 부담스러움' }
            ].map((item, idx) => (
              <div key={idx} className="card-interactive p-6 animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-fg font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-fg-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            이용 방법
          </h3>
          <p className="text-fg-muted text-center mb-12">
            단 5분이면 모든 과정이 완료됩니다
          </p>

          {/* Tab Selector */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex card p-1">
              <button
                onClick={() => setActiveTab('free')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeTab === 'free'
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                🆓 Free (무료 체험)
              </button>
              <button
                onClick={() => setActiveTab('premium')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeTab === 'premium'
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                💎 Premium (정확한 분석)
              </button>
            </div>
          </div>

          {/* Free Flow */}
          {activeTab === 'free' && (
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: '1', title: '크레딧포유 PDF 업로드', desc: '크레딧포유 앱에서 신용정보를 PDF로 다운로드 후 업로드', time: '1분' },
                { step: '2', title: 'AI 분석', desc: 'OCR로 정보를 추출하고 AI가 최적의 방안 분석', time: '5초' },
                { step: '3', title: '기본 결과 확인', desc: '총 부채, DTI, 추천 플랜 1가지 확인 (개요만)', time: '1분' }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="card p-6 animate-slide-up" style={{animationDelay: `${idx * 0.15}s`}}>
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                      {item.step}
                    </div>
                    <h4 className="text-fg font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-fg-muted text-sm mb-4">{item.desc}</p>
                    <div className="badge badge-primary text-xs">
                      {item.time}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <svg className="w-6 h-6 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Premium Flow */}
          {activeTab === 'premium' && (
            <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { step: '1', title: '회원가입', desc: '이메일 또는 카카오 간편가입', time: '30초' },
                { step: '2', title: '결제', desc: '₩19,000 (오늘만 할인)', time: '30초' },
                { step: '3', title: 'NICE 본인인증', desc: '휴대폰 인증으로 신용정보 조회 동의', time: '1분' },
                { step: '4', title: '완벽한 결과', desc: '3가지 플랜 비교 + 신청서 자동 생성', time: '1분' }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="card bg-brand-primary/10 border-brand-primary/30 p-6 animate-slide-up" style={{animationDelay: `${idx * 0.15}s`}}>
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                      {item.step}
                    </div>
                    <h4 className="text-fg font-semibold mb-2">{item.title}</h4>
                    <p className="text-fg-muted text-xs mb-3">{item.desc}</p>
                    <div className="badge badge-accent text-xs">
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            요금 안내
          </h3>
          <p className="text-fg-muted text-center mb-12">
            필요한 만큼만 선택하세요
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free Tier */}
            <div className="card rounded-2xl p-8 animate-slide-up">
              <div className="text-center mb-6">
                <div className="badge badge-secondary mb-4">
                  무료 체험
                </div>
                <div className="text-5xl font-bold text-fg mb-2">₩0</div>
                <div className="text-fg-muted">회원가입 불필요</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  크레딧포유 PDF 업로드
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  기본 분석 (총 부채, DTI)
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  1가지 추천 플랜 (개요만)
                </li>
                <li className="flex items-start text-fg-muted">
                  <svg className="w-5 h-5 text-fg-muted mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  정확한 신용정보 (추정치)
                </li>
                <li className="flex items-start text-fg-muted">
                  <svg className="w-5 h-5 text-fg-muted mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  플랜 비교 분석
                </li>
                <li className="flex items-start text-fg-muted">
                  <svg className="w-5 h-5 text-fg-muted mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  신청서 자동 생성
                </li>
              </ul>

              <button
                onClick={() => router.push('/free/upload')}
                className="btn btn-secondary w-full py-4"
              >
                무료로 시작하기
              </button>
            </div>

            {/* Premium Tier */}
            <div className="card rounded-2xl p-8 border-2 border-brand-primary/50 bg-brand-primary/10 relative animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                🔥 오늘만 특가
              </div>

              <div className="text-center mb-6 mt-4">
                <div className="badge badge-primary mb-4">
                  추천
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="text-2xl font-bold text-fg-muted line-through">₩29,000</div>
                  <div className="text-5xl font-bold text-fg">₩19,000</div>
                </div>
                <div className="text-success font-medium">33% 할인 (₩10,000 절약)</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>NICE API</strong> 실시간 정확한 정보</span>
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>3가지 플랜</strong> 상세 비교 분석</span>
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>신청서 PDF</strong> 자동 생성</span>
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>AI 승인 예측</strong> (정확도 95%)</span>
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>데이터 <strong>6개월</strong> 보관</span>
                </li>
                <li className="flex items-start text-fg">
                  <svg className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>카카오톡</strong> 1:1 상담</span>
                </li>
              </ul>

              <button
                onClick={() => router.push('/premium/signup')}
                className="btn btn-primary w-full py-4 transform hover:scale-105"
              >
                Premium 시작하기
              </button>
              
              <div className="text-center text-fg-muted text-xs mt-4">
                💡 법무사 비용 ₩30만원 절약
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-fg text-center mb-12">
            실제 사용자 후기
          </h3>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: '김*수', age: 38, amount: '₩8,700만원', savings: '월 ₩120만원 절감', comment: '정말 법무사 안 가고도 신청서를 받을 수 있어서 놀랐어요. 비용도 아끼고 시간도 절약했습니다.' },
              { name: '이*영', age: 42, amount: '₩1억 2천만원', savings: '월 ₩85만원 절감', comment: '무료로 먼저 확인해보고 Premium으로 넘어갔는데, 3가지 플랜 비교가 정말 도움됐어요.' },
              { name: '박*진', age: 35, amount: '₩6,500만원', savings: '월 ₩95만원 절감', comment: 'NICE 정보로 정확하게 분석해주니까 신뢰가 갔어요. 승인도 바로 나왔습니다.' }
            ].map((review, idx) => (
              <div key={idx} className="card p-6 animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="text-fg font-medium">{review.name} ({review.age}세)</div>
                    <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <div className="text-sm text-fg-muted mb-2">
                  부채: {review.amount}
                </div>
                <div className="text-success font-bold mb-3">
                  {review.savings}
                </div>
                <p className="text-fg text-sm">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-fg mb-6">
            지금 바로 시작하세요
          </h3>
          <p className="text-xl text-fg-muted mb-8">
            무료로 확인하고, 필요하면 Premium으로 완성하세요
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/free/upload')}
              className="btn btn-primary btn-lg w-full sm:w-auto px-10 py-5 text-xl transform hover:scale-105 shadow-2xl animate-fade-in"
            >
              🆓 무료로 시작하기
            </button>
          </div>
          <p className="text-fg-muted text-sm mt-6">
            이미 243명이 부채 문제를 해결했습니다
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-bg-elev/80">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg mr-2"></div>
                <span className="text-fg font-bold text-lg">qetta</span>
              </div>
              <p className="text-fg-muted text-sm">AI 기반 채무조정 플랫폼</p>
            </div>
            <div className="flex gap-6 text-fg-muted text-sm">
              <a href="#" className="link hover:text-fg">이용약관</a>
              <a href="#" className="link hover:text-fg">개인정보처리방침</a>
              <a href="#" className="link hover:text-fg">문의하기</a>
            </div>
          </div>
          <div className="text-center text-fg-muted text-xs mt-8">
            © 2025 qetta. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
