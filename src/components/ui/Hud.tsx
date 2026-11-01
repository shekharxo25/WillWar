"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface HudMessage {
  id: number;
  text: string;
  icon?: ReactNode;
}

const HudContext = createContext<(text: string, icon?: ReactNode) => void>(() => {});

/** HUD toast: glass capsule at top centre, one line, auto-dismiss after 2.4s, swipe up to dismiss. */
export function HudProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<HudMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startY = useRef<number | null>(null);

  const show = useCallback((text: string, icon?: ReactNode) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, icon });
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <HudContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-safe" aria-live="polite">
        {msg && (
          <div
            key={msg.id}
            role="status"
            className="glass pointer-events-auto mt-3 flex items-center gap-2 rounded-full px-4 py-2.5 text-headline motion-safe:animate-[hud-in_280ms_cubic-bezier(0.2,0.8,0.2,1)]"
            onPointerDown={(e) => (startY.current = e.clientY)}
            onPointerUp={(e) => {
              if (startY.current !== null && startY.current - e.clientY > 20) setMsg(null);
              startY.current = null;
            }}
          >
            {msg.icon && <span className="text-tide">{msg.icon}</span>}
            <span>{msg.text}</span>
          </div>
        )}
      </div>
    </HudContext.Provider>
  );
}

export function useHud() {
  return useContext(HudContext);
}
