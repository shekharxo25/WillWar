import { Suspense } from "react";
import { JoinCode } from "@/components/camp/JoinCode";

export const metadata = { title: "Join a camp" };

export default function JoinPage() {
  return (
    <Suspense>
      <JoinCode />
    </Suspense>
  );
}
