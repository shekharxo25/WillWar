"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";

/**
 * Bottom sheet: --bg-raised, top radius 16, 36x5 grabber, medium/large detents,
 * drag to dismiss, 50% dim behind, League Gothic title.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  detent = "medium",
  children,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  detent?: "medium" | "large";
  children: React.ReactNode;
  dismissible?: boolean;
}) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (!dismissible) return;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    setDrag(Math.max(0, e.clientY - startY.current));
  };
  const onUp = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (drag > 120) onOpenChange(false);
    setDrag(0);
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => (dismissible || o ? onOpenChange(o) : undefined)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--dim)]" />
        <Dialog.Content
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col rounded-t-sheet bg-raised pb-safe outline-none"
          style={{
            maxHeight: detent === "large" ? "calc(100dvh - env(safe-area-inset-top) - 24px)" : "min(70dvh, 640px)",
            minHeight: detent === "large" ? "calc(100dvh - env(safe-area-inset-top) - 24px)" : undefined,
            transform: drag ? `translateY(${drag}px)` : undefined,
            transition: drag ? "none" : "transform 180ms var(--ease-mech)",
          }}
        >
          <div className="no-select flex h-6 shrink-0 cursor-grab items-center justify-center touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <div className="h-[5px] w-9 rounded-full bg-[var(--text-3)]" aria-hidden />
          </div>
          <div className="sheet-body overflow-y-auto px-4 pb-6 sm:px-5">
            <Dialog.Title className="display text-[28px] leading-[30px]">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-2 text-[17px] leading-[22px] text-text-2">{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
            <div className="mt-5">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
