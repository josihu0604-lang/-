/**
 * Debt Analysis Result Page
 * 
 * Shows comprehensive debt analysis with:
 * - Current debt summary
 * - DTI/DSR visualization
 * - Restructuring plan comparisons
 * - Actionable recommendations
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import DebtSummary from '@/components/debt/DebtSummary';
import DebtChart from '@/components/debt/DebtChart';
import PlanComparison from '@/components/debt/PlanComparison';
import RecommendationsList from '@/components/debt/RecommendationsList';

interface PageProps {
  params: { id: string };
}

async function getAnalysis(id: string) {
  // In production, this would fetch from API with proper auth
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${apiUrl}/api/v1/debt/analyses/${id}`, {
      headers: {
        // Add auth token from cookies in production
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch analysis');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = params;
  const data = await getAnalysis(id);
  
  if (!data) {
    notFound();
  }
  
  const { analysis, plans } = data;
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            채무 분석 결과
          </h1>
          <p className="text-lg text-gray-600">
            {new Date(analysis.analyzedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} 분석 완료
          </p>
        </div>
        
        {/* Current Debt Summary */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            현재 채무 현황
          </h2>
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-xl" />}>
            <DebtSummary analysis={analysis} />
          </Suspense>
        </section>
        
        {/* Debt Visualization */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            채무 구성 분석
          </h2>
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-xl" />}>
            <DebtChart breakdown={analysis.breakdown} />
          </Suspense>
        </section>
        
        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              맞춤 추천사항
            </h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-xl" />}>
              <RecommendationsList recommendations={analysis.recommendations} />
            </Suspense>
          </section>
        )}
        
        {/* Restructuring Plans Comparison */}
        {plans && plans.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              채무조정 프로그램 비교
            </h2>
            <p className="text-gray-600 mb-6">
              귀하의 상황에 맞는 {plans.length}개의 채무조정 프로그램을 찾았습니다.
            </p>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-screen rounded-xl" />}>
              <PlanComparison plans={plans} analysisId={id} />
            </Suspense>
          </section>
        )}
        
        {/* No Plans Available */}
        {(!plans || plans.length === 0) && (
          <section className="mb-10">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                현재 이용 가능한 프로그램이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                귀하의 채무 상황에 맞는 프로그램이 현재 없습니다.
                재무 상담 전문가와 상담하시는 것을 권장합니다.
              </p>
              <a
                href="/contact"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                전문가 상담 신청
              </a>
            </div>
          </section>
        )}
        
        {/* Action Buttons */}
        <section className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            대시보드로 돌아가기
          </a>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            결과 인쇄하기
          </button>
        </section>
      </div>
    </main>
  );
}
