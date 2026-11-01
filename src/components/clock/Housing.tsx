/** Timer housing: black plastic box, radius 6, 1px top highlight, two mounting screws. No glow. */
export function Housing({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative rounded-housing bg-housing ${className}`}
      style={{ boxShadow: "inset 0 1px 0 var(--housing-highlight)", ...style }}
    >
      <Screw className="left-2 top-2" />
      <Screw className="right-2 top-2" />
      {children}
    </div>
  );
}

function Screw({ className }: { className: string }) {
  return (
    <span aria-hidden className={`absolute h-2 w-2 rounded-full bg-[var(--screw)] ${className}`}>
      <span className="absolute left-[1px] right-[1px] top-[3.5px] h-px rotate-[35deg] bg-housing" />
    </span>
  );
}
