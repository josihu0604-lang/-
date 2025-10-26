'use client';

import { useState } from 'react';

interface Plan {
  id: string;
  planType: string;
  planName: string;
  planDescription: string;
  adjustedPayment: number;
  adjustedInterestRate: number | null;
  estimatedPeriod: number;
  totalSavings: number | null;
  debtReductionRate: number | null;
  pros: string[];
  cons: string[];
  isRecommended: boolean;
  priority: number;
}

interface PlanComparisonProps {
  plans: Plan[];
  analysisId: string;
}

export default function PlanComparison({ plans, analysisId }: PlanComparisonProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    plans.find(p => p.isRecommended)?.id || plans[0]?.id || null
  );
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPeriod = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0 && remainingMonths > 0) {
      return `${years}년 ${remainingMonths}개월`;
    } else if (years > 0) {
      return `${years}년`;
    } else {
      return `${months}개월`;
    }
  };
  
  const handleApply = (planId: string) => {
    // In production, navigate to application form
    alert(`${plans.find(p => p.id === planId)?.planName} 신청하기 (구현 예정)`);
  };
  
  return (
    <div className="space-y-6">
      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'ring-4 ring-indigo-500 scale-105'
                : 'hover:shadow-xl hover:scale-102'
            } ${plan.isRecommended ? 'border-2 border-green-500' : 'border border-gray-200'}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {/* Recommended Badge */}
            {plan.isRecommended && (
              <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ⭐ 추천
              </div>
            )}
            
            {/* Plan Header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {plan.planName}
              </h3>
              <p className="text-sm text-gray-600">
                {plan.planDescription}
              </p>
            </div>
            
            {/* Key Metrics */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">월 상환액</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(plan.adjustedPayment)}
                </span>
              </div>
              
              {plan.adjustedInterestRate !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">조정 금리</span>
                  <span className="font-semibold text-gray-900">
                    {plan.adjustedInterestRate.toFixed(1)}%
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">상환 기간</span>
                <span className="font-semibold text-gray-900">
                  {formatPeriod(plan.estimatedPeriod)}
                </span>
              </div>
              
              {plan.totalSavings !== null && plan.totalSavings > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">총 절감액</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(plan.totalSavings)}
                  </span>
                </div>
              )}
              
              {plan.debtReductionRate !== null && plan.debtReductionRate > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">원금 감면율</span>
                    <span className="text-2xl font-bold text-green-700">
                      {plan.debtReductionRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Apply Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApply(plan.id);
              }}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.isRecommended
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {plan.isRecommended ? '추천 플랜 신청하기' : '신청하기'}
            </button>
          </div>
        ))}
      </div>
      
      {/* Detailed View of Selected Plan */}
      {selectedPlan && (() => {
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return null;
        
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {plan.planName} 상세정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pros */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span> 장점
                </h4>
                <ul className="space-y-2">
                  {plan.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-gray-700">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Cons */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">!</span> 주의사항
                </h4>
                <ul className="space-y-2">
                  {plan.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-gray-700">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
