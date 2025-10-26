'use client';

interface DebtSummaryProps {
  analysis: {
    totalDebt: number;
    totalAssets: number;
    monthlyPayment: number;
    dti: number;
    dsr: number;
    creditGrade: string;
    riskLevel: string;
  };
}

export default function DebtSummary({ analysis }: DebtSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getRiskLevelText = (risk: string) => {
    switch (risk) {
      case 'LOW': return '낮음';
      case 'MEDIUM': return '보통';
      case 'HIGH': return '높음';
      case 'CRITICAL': return '매우 높음';
      default: return risk;
    }
  };
  
  const getDTIStatus = (dti: number) => {
    if (dti < 30) return { text: '양호', color: 'text-green-600' };
    if (dti < 50) return { text: '주의', color: 'text-yellow-600' };
    if (dti < 70) return { text: '위험', color: 'text-orange-600' };
    return { text: '심각', color: 'text-red-600' };
  };
  
  const dtiStatus = getDTIStatus(analysis.dti);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Debt */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
        <div className="text-sm font-medium text-gray-500 mb-2">총 부채</div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatCurrency(analysis.totalDebt)}
        </div>
        {analysis.totalAssets > 0 && (
          <div className="text-sm text-gray-500">
            자산: {formatCurrency(analysis.totalAssets)}
          </div>
        )}
      </div>
      
      {/* Monthly Payment */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <div className="text-sm font-medium text-gray-500 mb-2">월 상환액</div>
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(analysis.monthlyPayment)}
        </div>
      </div>
      
      {/* DTI */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
        <div className="text-sm font-medium text-gray-500 mb-2">DTI (부채상환비율)</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900">
            {analysis.dti.toFixed(1)}%
          </div>
          <div className={`text-sm font-semibold ${dtiStatus.color}`}>
            {dtiStatus.text}
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                analysis.dti < 30 ? 'bg-green-500' :
                analysis.dti < 50 ? 'bg-yellow-500' :
                analysis.dti < 70 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(analysis.dti, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Risk Level */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <div className="text-sm font-medium text-gray-500 mb-2">위험도 평가</div>
        <div className="flex flex-col gap-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(analysis.riskLevel)}`}>
            {getRiskLevelText(analysis.riskLevel)}
          </div>
          <div className="text-sm text-gray-600">
            신용등급: <span className="font-semibold">{analysis.creditGrade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
