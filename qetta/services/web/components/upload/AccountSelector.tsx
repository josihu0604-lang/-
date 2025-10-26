/**
 * Account Selector Component
 * 
 * Displays bank accounts from OAuth providers with selection checkboxes
 */

'use client';

import { formatCurrency } from '@/lib/format';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  provider: string;
  lastSyncedAt: string;
}

interface AccountSelectorProps {
  accounts: BankAccount[];
  selectedAccounts: string[];
  onToggle: (accountId: string) => void;
  onSelectAll: () => void;
  loading?: boolean;
}

export default function AccountSelector({
  accounts,
  selectedAccounts,
  onToggle,
  onSelectAll,
  loading = false
}: AccountSelectorProps) {
  
  const allSelected = accounts.length > 0 && selectedAccounts.length === accounts.length;

  function getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'CHECKING': '입출금',
      'SAVINGS': '적금',
      'LOAN': '대출',
      'CREDIT_CARD': '신용카드',
      'INSTALLMENT_SAVINGS': '적립식 적금',
      'DEPOSIT': '예금'
    };
    return labels[type] || type;
  }

  function getAccountTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'CHECKING': 'bg-blue-500/20 text-blue-400',
      'SAVINGS': 'bg-green-500/20 text-green-400',
      'LOAN': 'bg-red-500/20 text-red-400',
      'CREDIT_CARD': 'bg-purple-500/20 text-purple-400',
      'INSTALLMENT_SAVINGS': 'bg-teal-500/20 text-teal-400',
      'DEPOSIT': 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">계좌 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">연동된 계좌가 없습니다</h3>
        <p className="text-gray-400 mb-6">
          먼저 OAuth 연동을 통해 은행 계좌를 연결해주세요
        </p>
        <a
          href="/consent"
          className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          OAuth 연동하기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {/* Select All Checkbox */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="w-5 h-5 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="ml-3 text-white font-medium group-hover:text-indigo-400 transition-colors">
            전체 선택
          </span>
        </label>
        <span className="text-sm text-gray-400">
          {selectedAccounts.length} / {accounts.length} 선택됨
        </span>
      </div>

      {/* Account List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {accounts.map((account) => {
          const isSelected = selectedAccounts.includes(account.id);
          
          return (
            <label
              key={account.id}
              className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-500/10 border-indigo-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(account.id)}
                className="w-5 h-5 mt-0.5 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
              />
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium mb-1">{account.bankName}</h4>
                    <p className="text-gray-400 text-sm font-mono">{account.accountNumber}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-white font-semibold text-lg">{formatCurrency(account.balance)}</p>
                    <p className="text-xs text-gray-500">잔액</p>
                  </div>
                </div>
                
                <div className="flex items-center mt-2 gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
                    {getAccountTypeLabel(account.accountType)}
                  </span>
                  
                  {account.provider === 'KFTC_OPENBANKING' && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                      오픈뱅킹
                    </span>
                  )}
                  
                  {account.provider === 'TOSS_CERT' && (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      토스
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-500 ml-auto">
                    마지막 동기화: {formatDate(account.lastSyncedAt)}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selected Summary */}
      {selectedAccounts.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">선택된 계좌 총 잔액</span>
            <span className="text-white font-bold text-lg">
              {formatCurrency(
                accounts
                  .filter(a => selectedAccounts.includes(a.id))
                  .reduce((sum, a) => sum + a.balance, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
