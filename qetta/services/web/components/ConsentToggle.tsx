'use client'
import { useState } from 'react'

const CHANNELS = ['email','sms','kakao'] as const
const SCOPES = ['marketing','openbanking','credit'] as const

export default function ConsentToggle(){
  const [state, setState] = useState<Record<string, boolean>>({})
  const togg = (k:string)=> setState(s=>({ ...s, [k]: !s[k] }))
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-lg font-semibold">동의 설정</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {CHANNELS.map(c=>(
          <div key={c} className="card p-4">
            <div className="font-medium mb-2">{c.toUpperCase()}</div>
            {SCOPES.map(s=>{
              const k = `${c}:${s}`; const on = !!state[k]
              return (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={on} onChange={()=>togg(k)} />
                  <span>{s}</span>
                </label>
              )
            })}
          </div>
        ))}
      </div>
      <div className="text-right">
        <button className="px-4 py-2 rounded-md bg-brand-primary text-fg-inverted">저장</button>
      </div>
    </div>
  )
}
