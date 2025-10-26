export default function Page(){
  return (<div>
    <h1 style={{fontSize:32,fontWeight:700,letterSpacing:-0.2}}>qetta — 3분 진단</h1>
    <p style={{color:'#666',marginTop:8}}>채무/서류의 이상을 빠르게 찾아내어 시간을 절약하세요.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12, marginTop:24}}>
      <div style={{border:'1px solid #eee',borderRadius:8,padding:16}}><div>STARTER</div><div style={{fontSize:24,fontWeight:600}}>₩29,000</div></div>
      <div style={{border:'1px solid #eee',borderRadius:8,padding:16}}><div>PRO</div><div style={{fontSize:24,fontWeight:600}}>₩199,000</div></div>
      <div style={{border:'1px solid #eee',borderRadius:8,padding:16}}><div>ENTERPRISE</div><div style={{fontSize:24,fontWeight:600}}>협의</div></div>
    </div>
  </div>)
}
