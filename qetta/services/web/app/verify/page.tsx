'use client'
import VerifyCard from '../../components/VerifyCard'

const mock = {
  severity_counts: { INFO:0, WARN:1, CRIT:0 },
  issues: [{ type:'AMOUNT_MISMATCH', severity:'WARN', message:'금액 불일치: 1.0% (허용: 3%)' }],
  metrics: { amountDiff: 0.01, dayDiff: 1 }
}

export default function Page(){
  return <VerifyCard data={mock} />
}
