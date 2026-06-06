import type { PageInfo } from '../../types';

interface PanelProps {
  selectedPages: PageInfo[];
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onReset: () => void;
}

export function Panel({ selectedPages, onRotateCW, onRotateCCW, onFlipH, onFlipV, onReset }: PanelProps) {
  if (selectedPages.length === 0) {
    return (
      <aside className="w-[260px] bg-apple-canvas rounded-apple-lg border border-apple-hairline p-6 shrink-0">
        <h3 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-ink mb-2">属性</h3>
        <p className="text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-apple-ink-muted-48">
          选择页面以查看属性
        </p>
      </aside>
    );
  }

  const page = selectedPages[0];
  const isMulti = selectedPages.length > 1;

  return (
    <aside className="w-[260px] bg-apple-canvas rounded-apple-lg border border-apple-hairline p-6 shrink-0">
      <h3 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-ink mb-4">
        {isMulti ? `已选择 ${selectedPages.length} 页` : '属性'}
      </h3>
      
      <div className="space-y-4">
        {!isMulti && (
          <div className="space-y-2">
            <label className="text-[12px] font-semibold tracking-[-0.12px] text-apple-ink-muted-48 uppercase">页面信息</label>
            <div className="text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-apple-ink space-y-1">
              <p>来源: PDF {page.sourcePdfIndex + 1}</p>
              <p>原页码: 第 {page.sourcePageIndex + 1} 页</p>
              <p>旋转: {page.rotation}°</p>
              <p>水平镜像: {page.flipH ? '是' : '否'}</p>
              <p>垂直镜像: {page.flipV ? '是' : '否'}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-[12px] font-semibold tracking-[-0.12px] text-apple-ink-muted-48 uppercase">快捷操作</label>
          <div className="space-y-1.5">
            <button onClick={onRotateCW} className="w-full apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] justify-center">
              顺时针旋转 90°
            </button>
            <button onClick={onRotateCCW} className="w-full apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] justify-center">
              逆时针旋转 90°
            </button>
            <button onClick={onFlipH} className="w-full apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] justify-center">
              水平镜像
            </button>
            <button onClick={onFlipV} className="w-full apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] justify-center">
              垂直镜像
            </button>
            <button onClick={onReset} className="w-full apple-btn-pearl text-[14px] font-semibold tracking-[-0.224px] justify-center mt-2">
              重置变换
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
