export default function PlanCard({ tier, price, features }:{ tier:string; price:number|string; features:string[] }){
  return (
    <div className="card p-6">
      <div className="text-fg-muted text-sm">{tier}</div>
      <div className="text-3xl font-semibold mt-2">{typeof price==='number' ? `₩${price.toLocaleString('ko-KR')}` : price}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {features.map((f,i)=> <li key={i}>• {f}</li>)}
      </ul>
      <button className="mt-5 w-full py-2 rounded-md bg-brand-primary text-fg-inverted">선택</button>
    </div>
  )
}
