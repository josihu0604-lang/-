export const metadata = { title:'qetta — 문서 검증 플랫폼', description:'3분 진단으로 채무/서류 이상을 빠르게 식별합니다.' }
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (<html lang="ko"><body>
    <header style={{padding:'12px 16px',borderBottom:'1px solid #eee'}}>
      <div style={{maxWidth:960,margin:'0 auto',display:'flex',justifyContent:'space-between'}}>
        <strong>qetta</strong>
        <nav style={{display:'flex',gap:12,fontSize:14}}>
          <a href="/consent">동의</a><a href="/upload">업로드</a><a href="/verify">검증</a><a href="/result">결과</a>
        </nav>
      </div>
    </header>
    <main style={{maxWidth:960,margin:'0 auto',padding:16}}>{children}</main>
    <footer style={{maxWidth:960,margin:'0 auto',padding:16,fontSize:12,color:'#666'}}>© 2025 qetta</footer>
  </body></html>)
}
