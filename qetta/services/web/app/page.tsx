import PlanCard from '../components/PlanCard'

export default function Page(){
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">qetta — 3분 진단</h1>
      <p className="text-fg-muted mt-2">채무/서류의 이상을 빠르게 찾아내어 시간을 절약하세요.</p>
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        <PlanCard tier="STARTER" price={29000} features={['월 100건 검증','이메일 지원','API 액세스']} />
        <PlanCard tier="PRO" price={199000} features={['월 1,000건 검증','우선 지원','Webhook','대시보드']} />
        <PlanCard tier="ENTERPRISE" price="협의" features={['무제한 검증','전담 매니저','SLA','커스텀 통합']} />
      </div>
    </div>
  )
}
