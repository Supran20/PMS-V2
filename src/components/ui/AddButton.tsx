import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/Button";

interface AddButtonProps {
  href: string;
  label: string;
  icon?: string;
  className?: string;
}

export function AddButton({
  href,
  label,
  icon = "mdi:plus",
  className = "",
}: AddButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant="primary"
        className={`flex items-center gap-2 shadow-sm hover:shadow-lg transition hover:duration-300  border-gray-200 text-gray-600 rounded-md ${className}`}
      >
        <Icon icon={icon} className="text-xl" />
        {label}
      </Button>
    </Link>
  );
}
