/** Three flat 10px lamps stacked: green (round on / checked in), amber (pending / last 30s), red (rest / active round). */
export function Lamps({ go = false, warn = false, red = false, size = 10, row = false }: { go?: boolean; warn?: boolean; red?: boolean; size?: number; row?: boolean }) {
  const lamp = (on: boolean, color: string, label: string) => (
    <span
      role="img"
      aria-label={`${label} lamp ${on ? "on" : "off"}`}
      className="block rounded-full"
      style={{ width: size, height: size, background: color, opacity: on ? 1 : 0.18, transition: "opacity 60ms linear" }}
    />
  );
  return (
    <div className={`flex ${row ? "flex-row" : "flex-col"} gap-2`}>
      {lamp(go, "var(--lamp-go)", "Green")}
      {lamp(warn, "var(--lamp-warn)", "Amber")}
      {lamp(red, "var(--led-housing)", "Red")}
    </div>
  );
}
