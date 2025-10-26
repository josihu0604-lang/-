import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'qetta — 문서 검증 플랫폼',
  description: '3분 진단으로 채무/서류 이상을 빠르게 식별합니다.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body>
        <header className="border-b border-white/5">
          <div className="container flex items-center justify-between h-14">
            <div className="font-semibold">qetta</div>
            <nav className="text-sm text-fg-muted space-x-5">
              <a href="/consent">동의</a>
              <a href="/upload">업로드</a>
              <a href="/verify">검증</a>
              <a href="/result">결과</a>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-10 text-fg-muted text-xs">© 2025 qetta</footer>
      </body>
    </html>
  )
}
