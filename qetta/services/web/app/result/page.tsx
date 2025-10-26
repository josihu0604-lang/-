import { ₩ } from '../../lib/format'
export default function Page(){
  const monthly = 150000; const total = 3400000
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-6">
        <div className="text-fg-muted text-sm">예상 월 부담</div>
        <div className="text-3xl font-semibold mt-1">{₩(monthly)}</div>
      </div>
      <div className="card p-6">
        <div className="text-fg-muted text-sm">예상 총 부담</div>
        <div className="text-3xl font-semibold mt-1">{₩(total)}</div>
      </div>
    </div>
  )
}
