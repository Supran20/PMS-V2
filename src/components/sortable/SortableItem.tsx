"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

type SortableItemProps = {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
  handle?: React.ReactNode; // optional drag handle
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
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-gray-100" : ""}
    >
      {/* Only the handle triggers drag */}
      <div
        {...(!disabled ? { ...attributes, ...listeners } : {})}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
};

export default SortableItem;

