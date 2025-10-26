'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [json,setJson]=useState<any>(null); const [err,setErr]=useState('')
  useEffect(()=>{ fetch((process.env.NEXT_PUBLIC_API_URL||'')+'/docs').then(r=>r.json()).then(setJson).catch(e=>setErr(String(e))) },[])
  return (<div><h3>검증 연결 테스트</h3>{err && <pre style={{color:'crimson'}}>{err}</pre>}<pre style={{background:'#111',color:'#0f0',padding:12,borderRadius:8}}>{JSON.stringify(json,null,2)}</pre></div>)
}
