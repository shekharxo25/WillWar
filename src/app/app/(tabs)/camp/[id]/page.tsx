import { Suspense } from "react";
import { CampDetail } from "@/components/camp/CampDetail";

export const metadata = { title: "Camp" };

export default function CampDetailPage() {
  return (
    <Suspense>
      <CampDetail />
    </Suspense>
  );
}
