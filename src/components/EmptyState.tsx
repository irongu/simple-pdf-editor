interface EmptyStateProps {
  onOpenPdf: () => void;
}

export function EmptyState({ onOpenPdf }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-apple-ink-muted-48 mb-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <h2 className="text-[40px] font-semibold leading-[1.10] text-apple-ink mb-3" style={{ fontFamily: "var(--font-display)" }}>
        PDF Editor
      </h2>
      <p className="text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-apple-ink-muted-48 text-center max-w-md">
        加载 PDF 文件以开始编辑。<br />
        支持直接拖拽添加PDF文件。<br />
        使用说明见右上角
      </p>
      <button onClick={onOpenPdf} className="apple-btn-primary text-[18px] font-light tracking-normal px-7 py-3.5" aria-label="打开 PDF 文件">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>打开 PDF</span>
      </button>
    </div>
  );
}
