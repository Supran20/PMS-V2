// components/ui/FormActions.tsx

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface FormActionsProps {
  cancelHref: string;
  submitLabel: string;
  loadingLabel: string;
  isSubmitting: boolean;
}

export function FormActions({
  cancelHref,
  submitLabel,
  loadingLabel,
  isSubmitting,
}: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-6 md:justify-end">
      <Link href={cancelHref}>
        <Button
          type="button"
          variant="secondary"
          className="border border-gray-300 dark:border-gray-600 rounded-md"
        >
          Cancel
        </Button>
      </Link>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
      >
        {isSubmitting ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}
