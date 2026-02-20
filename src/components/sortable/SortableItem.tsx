"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

type SortableItemProps = {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
};

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  disabled = false,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3">
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-gray-400 flex items-center pt-4 "
        >
          ⠿
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SortableItem;
