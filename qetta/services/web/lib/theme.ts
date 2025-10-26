export const sevLabel = (s:'CRIT'|'WARN'|'INFO') => ({ CRIT:'치명', WARN:'경고', INFO:'정보' }[s])
export const sevClass = (s:'CRIT'|'WARN'|'INFO') => ({ CRIT:'badge-crit', WARN:'badge-warn', INFO:'badge-info' }[s])
