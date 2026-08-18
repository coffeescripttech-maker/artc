"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

export interface DraggableItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error";
  meta?: { label: string; value: string | number }[];
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface DraggableListProps {
  items: DraggableItem[];
  onReorder: (items: DraggableItem[]) => void;
  renderItem?: (item: DraggableItem, dragHandleProps?: Record<string, unknown>) => React.ReactNode;
}

interface SortableItemProps {
  item: DraggableItem;
  children: React.ReactNode;
}

function SortableItem({ item, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

function DraggableItemContent({
  item,
  dragHandleProps,
}: {
  item: DraggableItem;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <Card
      className="hover:shadow-arc-md transition-all cursor-pointer"
      onClick={item.onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 text-arc-slate-400 hover:text-arc-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-arc-navy-900 truncate">{item.title}</h3>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.badgeVariant === "success" ? "bg-green-100 text-green-700" :
                  item.badgeVariant === "warning" ? "bg-yellow-100 text-yellow-700" :
                  item.badgeVariant === "error" ? "bg-red-100 text-red-700" :
                  "bg-arc-slate-100 text-arc-slate-600"
                }`}>
                  {item.badge}
                </span>
              )}
            </div>
            {item.subtitle && (
              <p className="text-sm text-arc-slate-500 truncate mt-0.5">{item.subtitle}</p>
            )}
            {item.meta && item.meta.length > 0 && (
              <div className="flex items-center gap-3 mt-1 text-xs text-arc-slate-400">
                {item.meta.map((m, i) => (
                  <span key={i}>{m.label}: <strong>{m.value}</strong></span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {item.onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  item.onEdit?.();
                }}
                className="p-1.5 hover:bg-arc-slate-100 rounded"
              >
                <svg className="h-4 w-4 text-arc-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {item.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  item.onDelete?.();
                }}
                className="p-1.5 hover:bg-red-50 rounded"
              >
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DraggableList({ items, onReorder, renderItem }: DraggableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onReorder(reorderedItems);
    }

    setActiveId(null);
  };

  const handleDragStart = (event: { active: { id: { toString: () => string } } }) => {
    setActiveId(event.active.id.toString());
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item) => (
            <SortableItem key={item.id} item={item}>
              <DraggableItemWithDragHandle
                item={item}
                renderItem={renderItem}
                isDragging={activeId === item.id}
              />
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Helper component to get drag handle props
function DraggableItemWithDragHandle({
  item,
  renderItem,
  isDragging,
}: {
  item: DraggableItem;
  renderItem?: (item: DraggableItem, dragHandleProps?: Record<string, unknown>) => React.ReactNode;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  if (renderItem) {
    return (
      <div ref={setNodeRef} style={style}>
        {renderItem(item, dragHandleProps)}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <DraggableItemContent item={item} dragHandleProps={dragHandleProps} />
    </div>
  );
}

export default DraggableList;
