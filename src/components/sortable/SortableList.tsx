"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onChange: (items: T[]) => void;
  onReorder?: (items: T[]) => Promise<void>;
  disabled?: boolean;
  children: (item: T) => React.ReactNode;
};

function SortableList<T>({
  items,
  getId,
  onChange,
  onReorder,
  disabled = false,
  children,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (disabled) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => getId(i) === String(active.id));
    const newIndex = items.findIndex((i) => getId(i) === String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Optimistic update
    onChange(newItems);

    // Persist to backend
    if (onReorder) {
      try {
        await onReorder(newItems);
      } catch (error) {
        // Rollback if failed
        onChange(items);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">{items.map((item) => children(item))}</div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
