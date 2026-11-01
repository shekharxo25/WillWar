import type { Metadata } from "next";
import { Me } from "@/components/me/Me";

export const metadata: Metadata = { title: "Me" };
export default function MePage() {
  return <Me />;
}
