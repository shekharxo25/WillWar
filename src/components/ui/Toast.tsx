"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type ToastApi = { show: (msg: string) => void };

/** A strip of tape: top center, 2.4s. */
export const ToastHost = forwardRef<ToastApi>(function ToastHost(_, ref) {
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useImperativeHandle(ref, () => ({
    show(m: string) {
      if (timer.current) clearTimeout(timer.current);
      setMsg(m);
      setKey((k) => k + 1);
      timer.current = setTimeout(() => setMsg(null), 2400);
    },
  }));
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center" style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
      {msg && (
        <div key={key} className="stamp rounded-toast bg-primary px-4 py-2 text-[15px] leading-5 font-semibold text-on-primary">
          {msg}
        </div>
      )}
    </div>
  );
});
