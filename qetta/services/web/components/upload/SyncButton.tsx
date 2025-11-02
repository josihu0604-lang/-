/**
 * Sync Button Component
 * 
 * Button to trigger account synchronization from OAuth providers
 */

'use client';

interface SyncButtonProps {
  onSync: () => void;
  loading?: boolean;
}

export default function SyncButton({ onSync, loading = false }: SyncButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
        loading
          ? 'bg-gray-600 cursor-not-allowed opacity-50'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
      }`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          동기화 중...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          계좌 동기화
        </>
      )}
    </button>
  );
}
