interface GlobalNavProps {
  totalPages: number;
  selectedCount: number;
  onHelp?: () => void;
}

export function GlobalNav({ totalPages, selectedCount, onHelp }: GlobalNavProps) {
  return (
    <nav className="h-11 bg-apple-surface-black text-apple-on-dark flex items-center justify-between px-6 select-none shrink-0">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span className="text-xs font-normal tracking-[-0.12px]">PDF Editor</span>
      </div>
      <div className="flex items-center gap-5">
        <span className="text-xs font-normal tracking-[-0.12px] text-apple-body-muted">
          页面数 <span className="text-apple-on-dark">{totalPages}</span>
        </span>
        <span className="text-xs font-normal tracking-[-0.12px] text-apple-body-muted">
          选中 <span className="text-apple-on-dark">{selectedCount}</span>
        </span>
        {onHelp && (
          <button
            onClick={onHelp}
            className="text-xs font-normal tracking-[-0.12px] text-apple-body-muted hover:text-apple-on-dark transition-colors flex items-center gap-1"
            aria-label="使用说明"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-apple-body-muted">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>使用说明</span>
          </button>
        )}
      </div>
    </nav>
  );
}
