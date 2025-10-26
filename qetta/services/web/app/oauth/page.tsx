'use client';

import { useState, useEffect } from 'react';

interface ConnectedProvider {
  provider: string;
  providerUserId?: string;
  tokenExpiresAt?: string;
  scope?: string;
  connectedAt: string;
  lastUpdated: string;
}

interface OAuthStatus {
  connected: ConnectedProvider[];
}

export default function OAuthPage() {
  const [status, setStatus] = useState<OAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      // In production, you'd get the token from your auth context/cookie
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch('/api/v1/oauth/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to load OAuth status');
      }

      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTossTest = async () => {
    try {
      setTesting('toss');
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch('/api/v1/oauth/toss/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Toss OAuth 연결 테스트 성공!\n토큰 타입: ' + data.tokenType + '\n만료시간: ' + data.expiresIn + '초');
      } else {
        alert('❌ Toss OAuth 테스트 실패: ' + data.message);
      }
    } catch (err: any) {
      alert('❌ 오류: ' + err.message);
    } finally {
      setTesting(null);
    }
  };

  const handleKftcConnect = async () => {
    try {
      setTesting('kftc');
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch('/api/v1/oauth/kftc/authorize', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.authorizationUrl) {
        // Open in popup
        const popup = window.open(
          data.authorizationUrl,
          'KFTC OAuth',
          'width=600,height=700,scrollbars=yes'
        );

        // Listen for success message
        window.addEventListener('message', (event) => {
          if (event.data.type === 'KFTC_AUTH_SUCCESS') {
            popup?.close();
            loadStatus(); // Reload status
            alert('✅ OpenBanking 연동 완료!');
          }
        });
      }
    } catch (err: any) {
      alert('❌ 오류: ' + err.message);
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`정말로 ${provider} 연동을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const providerKey = provider === 'TOSS_CERT' ? 'toss' : 'kftc';
      
      const res = await fetch(`/api/v1/oauth/${providerKey}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to disconnect');
      }

      alert('✅ 연동 해제 완료');
      loadStatus();
    } catch (err: any) {
      alert('❌ 오류: ' + err.message);
    }
  };

  const providerNames: Record<string, string> = {
    'TOSS_CERT': '토스 인증',
    'KFTC_OPENBANKING': '금융결제원 오픈뱅킹'
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        외부 인증 연동
      </h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        토스 인증 및 금융결제원 오픈뱅킹과 연동하여 서비스를 이용하세요.
      </p>

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          color: '#c00'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Connection Status */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          연결 상태
        </h2>
        
        {status && status.connected.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {status.connected.map((conn, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {providerNames[conn.provider] || conn.provider}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    연결일: {new Date(conn.connectedAt).toLocaleDateString('ko-KR')}
                  </div>
                  {conn.tokenExpiresAt && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      토큰 만료: {new Date(conn.tokenExpiresAt).toLocaleString('ko-KR')}
                    </div>
                  )}
                  {conn.scope && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      권한: {conn.scope}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDisconnect(conn.provider)}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  연동 해제
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            연결된 외부 인증이 없습니다.
          </div>
        )}
      </div>

      {/* Toss Certification */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.00))',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          🔐 토스 인증 (Toss Certification)
        </h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          본인확인, 간편인증, 전자서명 서비스를 이용할 수 있습니다.
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.5)', 
          padding: 12, 
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 16,
          fontFamily: 'monospace'
        }}>
          <div>• 인증 서버: oauth2.cert.toss.im</div>
          <div>• API 서버: cert.toss.im</div>
          <div>• 연결 방식: Client Credentials</div>
        </div>

        <button
          onClick={handleTossTest}
          disabled={testing === 'toss'}
          style={{
            padding: '12px 24px',
            background: testing === 'toss' ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: testing === 'toss' ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600
          }}
        >
          {testing === 'toss' ? '테스트 중...' : '🧪 연결 테스트'}
        </button>
      </div>

      {/* KFTC OpenBanking */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.00))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 16,
        padding: 24
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          🏦 금융결제원 오픈뱅킹 (KFTC OpenBanking)
        </h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          계좌 잔액 조회, 거래 내역 조회 등의 오픈뱅킹 API를 사용할 수 있습니다.
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.5)', 
          padding: 12, 
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 16,
          fontFamily: 'monospace'
        }}>
          <div>• API 서버: testapi.openbanking.or.kr</div>
          <div>• 연결 방식: Authorization Code</div>
          <div>• 권한 범위: login, inquiry</div>
        </div>

        <button
          onClick={handleKftcConnect}
          disabled={testing === 'kftc'}
          style={{
            padding: '12px 24px',
            background: testing === 'kftc' ? '#ccc' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: testing === 'kftc' ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600
          }}
        >
          {testing === 'kftc' ? '연결 중...' : '🔗 OpenBanking 연결'}
        </button>
      </div>

      {/* Guide Links */}
      <div style={{
        marginTop: 32,
        padding: 20,
        background: '#f9fafb',
        borderRadius: 12,
        fontSize: 14
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          📚 가이드 문서
        </h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
          <li style={{ marginBottom: 8 }}>
            <a href="/toss_auth_api.html" target="_blank" style={{ color: '#10b981' }}>
              토스 인증 연동 가이드
            </a>
          </li>
          <li>
            <a href="/openbanking_local_callback_guide.html" target="_blank" style={{ color: '#6366f1' }}>
              오픈뱅킹 OAuth 콜백 가이드
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
