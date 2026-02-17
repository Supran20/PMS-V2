// components/ui/PageHeader.tsx

import Link from "next/link";
import { Icon } from "@iconify/react";

interface PageHeaderProps {
  title: string;
  backHref: string;
}

export function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Link
        href={backHref}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Icon icon="mdi:arrow-left" className="text-xl" />
      </Link>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
    </div>
  );
}
