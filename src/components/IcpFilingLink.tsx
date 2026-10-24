export const ICP_FILING_LABEL = "沪ICP备2025111002号-4"
export const ICP_FILING_HREF = "https://beian.miit.gov.cn/"

/** Static anchor so the filing number is in the server HTML, not painted later by script. */
export function IcpFilingLink({ className }: { className?: string }) {
  return (
    <a href={ICP_FILING_HREF} target="_blank" rel="noopener noreferrer" className={className}>
      {ICP_FILING_LABEL}
    </a>
  )
}
