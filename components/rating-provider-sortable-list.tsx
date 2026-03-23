'use client';

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { RATING_PROVIDER_OPTIONS, type RatingPreference } from '@/lib/ratingPreferences';
import type { RatingProviderRow } from '@/lib/ratingRows';

export type RatingProviderSortableListProps = {
  rows: RatingProviderRow[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggle: (id: RatingPreference) => void;
};

const dropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: '0.35' },
    },
  }),
};

function SortableRow({
  row,
  onToggle,
}: {
  row: RatingProviderRow;
  onToggle: (id: RatingPreference) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    transition: {
      duration: 220,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const meta = RATING_PROVIDER_OPTIONS.find((o) => o.id === row.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex min-w-0 items-center gap-1 rounded-lg border px-1.5 py-1.5 text-[11px] ${
        row.enabled
          ? 'border-orange-500/40 bg-[#141b26]/80 text-white'
          : 'border-white/10 bg-[#080b10] text-slate-400'
      } ${isDragging ? 'z-10 opacity-[0.22] ring-1 ring-orange-500/20' : 'opacity-100'}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${meta?.label ?? row.id}`}
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-500 hover:text-orange-300/90 active:cursor-grabbing [-webkit-tap-highlight-color:transparent]"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={() => onToggle(row.id)}
          className="h-3 w-3 shrink-0 accent-orange-500"
        />
        <span className="truncate">{meta?.label ?? row.id}</span>
      </label>
    </li>
  );
}

function DragPreview({ row }: { row: RatingProviderRow }) {
  const meta = RATING_PROVIDER_OPTIONS.find((o) => o.id === row.id);
  return (
    <div
      className={`pointer-events-none flex min-w-[140px] max-w-[min(100vw-2rem,280px)] items-center gap-2 rounded-xl border px-2 py-2 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.65)] ring-2 ring-orange-500/35 ${
        row.enabled
          ? 'border-orange-400/50 bg-[#1a2230]/95 text-white'
          : 'border-white/20 bg-[#0d1018]/95 text-slate-300'
      }`}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-orange-400/80" />
      <span className="truncate text-xs font-medium">{meta?.label ?? row.id}</span>
    </div>
  );
}

export function RatingProviderSortableList({ rows, onReorder, onToggle }: RatingProviderSortableListProps) {
  const [activeId, setActiveId] = useState<RatingPreference | null>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const itemIds = useMemo(() => rows.map((r) => r.id), [rows]);

  useLayoutEffect(() => {
    setOverlayRoot(document.body);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as RatingPreference);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(oldIndex, newIndex);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-[min(22rem,55vh)] overflow-y-auto pr-0.5 [touch-action:pan-y]">
          {rows.map((row) => (
            <SortableRow key={row.id} row={row} onToggle={onToggle} />
          ))}
        </ul>
      </SortableContext>
      {overlayRoot
        ? createPortal(
            <DragOverlay dropAnimation={dropAnimation} zIndex={9999}>
              {activeRow ? <DragPreview row={activeRow} /> : null}
            </DragOverlay>,
            overlayRoot
          )
        : null}
    </DndContext>
  );
}
