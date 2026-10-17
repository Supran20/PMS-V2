// components/ui/PageHeader.tsx

import Link from "next/link";
import { Icon } from "@iconify/react";
import { AddButton } from "@/components/ui/AddButton";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function PageHeader({
  title,
  backHref,
  actionHref,
  actionLabel,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="text-xl" />
          </Link>
        )}

        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      {actionHref && actionLabel && (
        <AddButton href={actionHref} label={actionLabel} />
      )}
    </div>
  );
}
