/**
 * The WillWar mark: a "W" drawn as two wave crests side by side (DESIGN.md section 8).
 * `tile` draws it white on the water gradient (app icon); otherwise it inherits currentColor.
 */
export function Mark({ size = 28, tile = false, title }: { size?: number; tile?: boolean; title?: string }) {
  const crest = "M4 8.5C6 8.5 7.5 23.5 10 23.5S13.5 12.5 16 12.5 19.5 23.5 22 23.5 26 8.5 28 8.5";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {tile ? (
        <>
          <defs>
            <linearGradient id="ww-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--tide)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--tide-deep)" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#ww-water)" />
          <path d={crest} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <path d={crest} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * Interim wordmark. DESIGN.md calls for SVG outlines from a face licensed for logo
 * use; until that face is chosen this renders the mark plus the name in system-ui.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className ?? ""}`}>
      <Mark size={28} tile />
      <span>WillWar</span>
    </span>
  );
}
