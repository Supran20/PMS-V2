"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-6">
      <Button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="py-1 px-4 rounded-md bg-green-600 text-white disabled:opacity-50"
      >
        Previous
      </Button>

      <span className="text-sm font-medium">
        {currentPage} / {totalPages}
      </span>

      <Button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="py-1 px-4 rounded-md bg-green-600 text-white disabled:opacity-50"
      >
        Next
      </Button>
    </div>
  );
};

