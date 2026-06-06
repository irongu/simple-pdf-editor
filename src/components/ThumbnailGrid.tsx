import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageInfo } from '../types';

interface ThumbnailGridProps {
  pages: PageInfo[];
  selectedIds: Set<string>;
  thumbnailMap: Map<string, string>;
  onSelect: (id: string, multi?: boolean, range?: boolean) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  loading?: boolean;
}

function SortableThumbnail({
  page,
  index,
  isSelected,
  imgUrl,
  loading,
  onSelect,
}: {
  page: PageInfo;
  index: number;
  isSelected: boolean;
  imgUrl: string | undefined;
  loading?: boolean;
  onSelect: (id: string, multi?: boolean, range?: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isRotated90 = page.rotation === 90 || page.rotation === 270;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-apple-canvas rounded-apple-sm cursor-pointer transition-colors duration-150 overflow-hidden
        ${isSelected ? 'ring-2 ring-apple-primary' : ''}
      `}
      onClick={(e) => {
        if (!isDragging) {
          onSelect(page.id, e.ctrlKey || e.metaKey, e.shiftKey);
        }
      }}
    >
      {/* Drag handle area - top of card */}
      <div
        {...attributes}
        {...listeners}
        className="h-7 bg-apple-canvas-parchment flex items-center justify-center cursor-grab active:cursor-grabbing rounded-t-apple-sm border-b border-apple-hairline"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-apple-ink-muted-48">
          <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      </div>

      <div
        className={`relative ${isRotated90 ? 'aspect-[4/3]' : 'aspect-[3/4]'} bg-apple-canvas-parchment flex items-center justify-center overflow-hidden`}
        style={{ boxShadow: 'var(--shadow-product)' }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={`第 ${index + 1} 页`}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: [
                page.rotation ? `rotate(${page.rotation}deg)` : '',
                page.flipH ? 'scaleX(-1)' : '',
                page.flipV ? 'scaleY(-1)' : '',
              ].filter(Boolean).join(' ') || 'none',
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
        ) : loading ? (
          <div className="w-8 h-8 border-3 border-apple-hairline border-t-apple-primary rounded-full animate-spin" />
        ) : (
          <span className="text-[14px] text-apple-ink-muted-48">第 {index + 1} 页</span>
        )}
      </div>

      <div className="px-3 py-2">
        <p className="text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-apple-ink text-center">
          {index + 1}
        </p>
      </div>
    </div>
  );
}

export function ThumbnailGrid({ pages, selectedIds, thumbnailMap, onSelect, onReorder, loading }: ThumbnailGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Need to move 8px before drag starts
      },
    })
  );

  const pageIds = useMemo(() => pages.map(p => p.id), [pages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pageIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {pages.map((page, index) => (
            <SortableThumbnail
              key={page.id}
              page={page}
              index={index}
              isSelected={selectedIds.has(page.id)}
              imgUrl={thumbnailMap.get(page.id)}
              loading={loading}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
