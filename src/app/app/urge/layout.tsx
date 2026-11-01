import { UrgeFlowProvider } from "@/components/games/UrgeFlow";

// Ride it out is full screen: no tab bar, no pill, no ads, no paywall before a game.
export default function UrgeLayout({ children }: LayoutProps<"/app/urge">) {
  return (
    <div className="min-h-dvh bg-linear-to-b from-tide-deep to-black text-white">
      <UrgeFlowProvider>{children}</UrgeFlowProvider>
    </div>
  );
}
