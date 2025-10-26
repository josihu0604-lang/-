export default function SeverityPill({ label, kind }:{ label:string; kind:'CRIT'|'WARN'|'INFO' }){
  const cls = kind==='CRIT' ? 'badge-crit' : kind==='WARN' ? 'badge-warn' : 'badge-info'
  return <span className={cls}>{label}</span>
}
