'use client'
import SeverityPill from './SeverityPill'
import { ₩, pct } from '../lib/format'
import { sevClass, sevLabel } from '../lib/theme'

type Issue = { type:string; severity:'CRIT'|'WARN'|'INFO'; message:string }
type Result = {
  severity_counts: { INFO:number; WARN:number; CRIT:number };
  issues: Issue[];
  metrics?: { amountDiff?: number; dayDiff?: number };
}

export default function VerifyCard({ data }:{ data: Result }){
  const { severity_counts, issues, metrics } = data
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">검증 결과</h3>
        <div className="flex gap-2">
          <span className="badge-info">INFO {severity_counts.INFO}</span>
          <span className="badge-warn">WARN {severity_counts.WARN}</span>
          <span className="badge-crit">CRIT {severity_counts.CRIT}</span>
        </div>
      </div>
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {'amountDiff' in (metrics||{}) && <div className="card p-3"><div className="text-fg-muted">금액 차이</div><div className="font-medium">{pct(metrics!.amountDiff||0)}</div></div>}
          {'dayDiff' in (metrics||{}) && <div className="card p-3"><div className="text-fg-muted">일자 차이</div><div className="font-medium">{(metrics!.dayDiff||0)}일</div></div>}
        </div>
      )}
      <ul className="space-y-2">
        {issues.map((it, i)=> (
          <li key={i} className="flex items-start gap-3">
            <SeverityPill kind={it.severity} label={sevLabel(it.severity)} />
            <div className="text-sm">
              <div className="font-medium">{it.type}</div>
              <div className="text-fg-muted">{it.message}</div>
            </div>
          </li>
        ))}
        {issues.length===0 && <li className="text-fg-muted text-sm">이상이 감지되지 않았습니다.</li>}
      </ul>
      <div className="flex gap-3 pt-2">
        <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15">다시 수집</button>
        <button className="px-4 py-2 rounded-md bg-brand-primary text-fg-inverted hover:opacity-90">제출 진행</button>
      </div>
    </div>
  )
}
