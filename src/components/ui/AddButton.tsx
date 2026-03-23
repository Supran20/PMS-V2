import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/Button";

interface AddButtonProps {
  href: string;
  label: string;
  icon?: string;
  className?: string;
  disabled?: boolean; // ✅ add this
  onClick?: (e: React.MouseEvent) => void;
}

export function AddButton({
  href,
  label,
  icon = "mdi:plus",
  className = "",
  disabled = false,
  onClick,
}: AddButtonProps) {
  // 🚫 prevent navigation if disabled
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick}>
      <Button
        variant="primary"
        disabled={disabled}
        className={`flex items-center gap-2 shadow-sm hover:shadow-lg transition hover:duration-300 border-gray-200 text-gray-600 rounded-md ${className}`}
      >
        <Icon icon={icon} className="text-xl" />
        {label}
      </Button>
    </Link>
  );
}
