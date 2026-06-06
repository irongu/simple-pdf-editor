interface ToolbarProps {
  onOpenPdf: () => void;
  onAppendPdf: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onRotate180: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onExportPdf: () => void;
  onExportSelected: () => void;
  onDelete: () => void;
  onReset: () => void;
  hasSelection: boolean;
  hasPages: boolean;
  flipHActive: boolean;
  flipVActive: boolean;
}

export function Toolbar({
  onOpenPdf, onAppendPdf,
  onRotateCW, onRotateCCW, onRotate180,
  onFlipH, onFlipV,
  onExportPdf, onExportSelected,
  onDelete, onReset,
  hasSelection, hasPages,
  flipHActive, flipVActive,
}: ToolbarProps) {
  return (
    <div className="h-[52px] bg-apple-canvas-parchment border-b border-apple-hairline flex items-center px-6 gap-1 shrink-0 select-none">
      {/* File operations */}
      <div className="flex items-center gap-1.5">
        <button onClick={onOpenPdf} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" aria-label="打开 PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>打开 PDF</span>
        </button>
        <button onClick={onAppendPdf} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" aria-label="追加 PDF" disabled={!hasPages}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>追加 PDF</span>
        </button>
      </div>

      <div className="w-px h-6 bg-apple-hairline mx-3" />

      {/* Transform operations */}
      <div className="flex items-center gap-1.5">
        <button onClick={onRotateCW} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasSelection} aria-label="顺时针旋转 90°" title="顺时针旋转 90°">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
        <button onClick={onRotateCCW} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasSelection} aria-label="逆时针旋转 90°" title="逆时针旋转 90°">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button onClick={onRotate180} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasSelection} aria-label="旋转 180°" title="旋转 180°">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
      </div>

      <div className="w-px h-6 bg-apple-hairline mx-3" />

      <div className="flex items-center gap-1.5">
        <button onClick={onFlipH} className={`apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] ${flipHActive && hasSelection ? 'ring-2 ring-apple-primary' : ''}`} disabled={!hasSelection} aria-label="水平镜像" title="水平镜像">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/><line x1="4" y1="4" x2="4" y2="20"/></svg>
        </button>
        <button onClick={onFlipV} className={`apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] ${flipVActive && hasSelection ? 'ring-2 ring-apple-primary' : ''}`} disabled={!hasSelection} aria-label="垂直镜像" title="垂直镜像">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/><line x1="4" y1="4" x2="4" y2="20"/></svg>
        </button>
      </div>

      <div className="flex-1" />

      {/* Export & actions */}
      <div className="flex items-center gap-1.5">
        <button onClick={onReset} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasSelection} aria-label="重置变换">
          重置
        </button>
        <button onClick={onDelete} className="apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] text-apple-ink-muted-80" disabled={!hasSelection} aria-label="删除选中页面">
          删除
        </button>
      </div>

      <div className="w-px h-6 bg-apple-hairline mx-3" />

      <div className="flex items-center gap-1.5">
        <button onClick={onExportSelected} className="apple-btn-secondary text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasSelection} aria-label="导出选中页面">
          导出选中
        </button>
        <button onClick={onExportPdf} className="apple-btn-primary text-[14px] font-semibold tracking-[-0.224px]" disabled={!hasPages} aria-label="导出 PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出 PDF
        </button>
      </div>
    </div>
  );
}
