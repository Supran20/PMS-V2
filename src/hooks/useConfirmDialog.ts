import { useCallback, useState } from "react";

export function useConfirmDialog<T>() {
  const [item, setItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((next: T) => {
    setItem(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { item, isOpen, open, close };
}
