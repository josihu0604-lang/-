'use client';

interface DebtChartProps {
  breakdown: {
    byType: {
      loans: { count: number; totalAmount: number; monthlyPayment: number };
      creditCards: { count: number; totalAmount: number; monthlyPayment: number };
      other: { count: number; totalAmount: number; monthlyPayment: number };
    };
    byCreditor: Array<{
      name: string;
      amount: number;
      monthlyPayment: number;
    }>;
    largestDebt: {
      creditor: string;
      amount: number;
      percentage: number;
    };
  };
}

export default function DebtChart({ breakdown }: DebtChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const totalDebt = breakdown.byType.loans.totalAmount + 
                   breakdown.byType.creditCards.totalAmount + 
                   breakdown.byType.other.totalAmount;
  
  const loanPercentage = totalDebt > 0 ? (breakdown.byType.loans.totalAmount / totalDebt) * 100 : 0;
  const ccPercentage = totalDebt > 0 ? (breakdown.byType.creditCards.totalAmount / totalDebt) * 100 : 0;
  const otherPercentage = totalDebt > 0 ? (breakdown.byType.other.totalAmount / totalDebt) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart Replacement - Stacked Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">채무 유형별 구성</h3>
        
        <div className="space-y-4">
          {breakdown.byType.loans.totalAmount > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">대출 ({breakdown.byType.loans.count}건)</span>
                <span className="text-gray-600">{loanPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                <div 
                  className="bg-red-500 h-8 flex items-center justify-end pr-2 text-white text-xs font-semibold"
                  style={{ width: `${loanPercentage}%` }}
                >
                  {formatCurrency(breakdown.byType.loans.totalAmount)}
                </div>
              </div>
            </div>
          )}
          
          {breakdown.byType.creditCards.totalAmount > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">신용카드 ({breakdown.byType.creditCards.count}건)</span>
                <span className="text-gray-600">{ccPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                <div 
                  className="bg-orange-500 h-8 flex items-center justify-end pr-2 text-white text-xs font-semibold"
                  style={{ width: `${ccPercentage}%` }}
                >
                  {formatCurrency(breakdown.byType.creditCards.totalAmount)}
                </div>
              </div>
            </div>
          )}
          
          {breakdown.byType.other.totalAmount > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">기타 ({breakdown.byType.other.count}건)</span>
                <span className="text-gray-600">{otherPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                <div 
                  className="bg-blue-500 h-8 flex items-center justify-end pr-2 text-white text-xs font-semibold"
                  style={{ width: `${otherPercentage}%` }}
                >
                  {formatCurrency(breakdown.byType.other.totalAmount)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Largest Debt Highlight */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">최대 채무</div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">{breakdown.largestDebt.creditor}</span>
            <span className="text-lg font-bold text-amber-700">
              {breakdown.largestDebt.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formatCurrency(breakdown.largestDebt.amount)}
          </div>
        </div>
      </div>
      
      {/* Creditor List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">채권자별 상세</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {breakdown.byCreditor.map((creditor, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{creditor.name}</div>
                <div className="text-sm text-gray-600">
                  월 상환: {formatCurrency(creditor.monthlyPayment)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {formatCurrency(creditor.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
