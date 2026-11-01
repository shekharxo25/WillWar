"use client";

import { Dialog } from "radix-ui";
import { useRef, type ReactNode } from "react";

/**
 * Bottom sheet: 36×5 grabber, top radius 22, 40% dim, drag down to dismiss.
 * Radix Dialog provides focus management and the labelled dialog role.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  detent = "medium",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  detent?: "medium" | "large";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0 };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !panel.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    if (!drag.current || !panel.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panel.current.style.transform = "";
    if (dy > 90) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--dim)] data-[state=open]:animate-[fade-in_200ms_ease-out] motion-reduce:animate-none" />
        <Dialog.Content
          ref={panel}
          aria-describedby={description ? undefined : undefined}
          className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col rounded-t-sheet bg-grouped pb-safe shadow-float transition-transform duration-200 ease-out data-[state=open]:animate-[sheet-up_320ms_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none ${
            detent === "large" ? "max-h-[92dvh]" : "max-h-[75dvh]"
          }`}
        >
          <div
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2 pb-1"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="h-[5px] w-9 rounded-full bg-label-3" aria-hidden />
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 pb-4">
            <Dialog.Title className="pt-2 text-title-2 font-bold">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-2 text-body text-label-2">{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Sheet"}</Dialog.Description>
            )}
            <div className="mt-4">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
