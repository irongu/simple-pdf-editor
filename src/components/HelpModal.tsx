import { useEffect, useRef } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const features = [
  {
    title: '文件操作',
    items: [
      { label: '打开 PDF', desc: '加载一个 PDF 文件并渲染所有页面缩略图。打开新文件会替换当前内容。' },
      { label: '追加 PDF', desc: '将另一个 PDF 的全部页面追加到当前列表末尾，实现 PDF 合并。', disabledHint: '需先加载至少一个 PDF' },
    ],
  },
  {
    title: '页面选择',
    items: [
      { label: '单选', desc: '点击缩略图卡片选中/取消选中。选中的卡片显示蓝色边框。' },
      { label: '多选 (Ctrl+Click)', desc: '按住 Ctrl 键点击缩略图，可追加或取消选中单页。' },
      { label: '范围选择 (Shift+Click)', desc: '先点击起始页，按住 Shift 点击目标页，选中中间所有页面。' },
    ],
  },
  {
    title: '页面变换',
    items: [
      { label: '旋转', desc: '顺时针 90°、逆时针 90° 或 180° 旋转选中页面。旋转仅在预览和导出时改变方向，不修改页面内容。快捷键 R。' },
      { label: '镜像', desc: '水平或垂直翻转选中页面。再次点击取消镜像。快捷键 H（水平）/ V（垂直）。' },
      { label: '拖拽排序', desc: '拖拽缩略图顶部的三横线手柄，调整页面在输出 PDF 中的顺序。' },
      { label: '重置变换', desc: '将选中页面的旋转角度和镜像状态恢复为初始值。' },
    ],
  },
  {
    title: '导出与删除',
    items: [
      { label: '导出 PDF', desc: '将编辑后的页面，合并导出为一个 PDF。文件名包含时间戳。' },
      { label: '导出选中', desc: '仅将当前选中的页面导出为一个 PDF。' },
      { label: '删除页面', desc: '从列表中移除选中页面。快捷键 Delete 或 Backspace。' },
    ],
  },
  {
    title: '键盘快捷键',
    items: [
      { label: 'R', desc: '顺时针旋转 90°' },
      { label: 'H', desc: '水平镜像（切换）' },
      { label: 'V', desc: '垂直镜像（切换）' },
      { label: 'Delete / Backspace', desc: '删除选中页面' },
      { label: 'Escape', desc: '取消所有选中' },
    ],
  },
  {
    title: '关于',
    items: [
      { label: '隐私安全', desc: '所有 PDF 处理均在浏览器本地完成，文件不会上传到任何服务器。' },
    ],
  },
];

export function HelpModal({ open, onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="bg-apple-canvas rounded-apple-lg w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden mx-4"
        style={{ padding: '0 48px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-5 border-b border-apple-hairline shrink-0">
          <h2 className="text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-apple-ink font-[family-name:var(--font-display)]">
            使用说明
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-apple-surface-chip/60 hover:bg-apple-surface-chip transition-colors text-apple-ink"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-8 space-y-8">
          {features.map((section) => (
            <section key={section.title}>
              <h3 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-apple-ink-muted-48 mb-3">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <span className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-apple-ink whitespace-nowrap min-w-[140px]">
                      {item.label}
                    </span>
                    <span className="text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-apple-ink-muted-80">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="py-5 border-t border-apple-hairline shrink-0 flex justify-end">
          <button onClick={onClose} className="apple-btn-primary">
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
