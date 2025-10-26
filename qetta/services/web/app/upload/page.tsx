export default function Page(){
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">문서/CSV 업로드</h3>
      <p className="text-fg-muted text-sm mt-1">민감정보 마스킹/AV 스캔 후 처리됩니다.</p>
      <div className="mt-4 p-8 border border-dashed border-white/10 rounded-md text-center text-fg-muted">드래그 앤 드롭 또는 클릭하여 선택</div>
    </div>
  )
}
