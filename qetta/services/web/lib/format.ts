export const ₩ = (n:number) => new Intl.NumberFormat('ko-KR', { style:'currency', currency:'KRW', maximumFractionDigits:0 }).format(n)
export const pct = (n:number) => `${(n*100).toFixed(1)}%`
export const date = (iso:string) => new Date(iso).toLocaleDateString('ko-KR', { dateStyle:'medium' })
