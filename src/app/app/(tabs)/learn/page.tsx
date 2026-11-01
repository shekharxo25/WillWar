import type { Metadata } from "next";
import { Screen } from "@/components/ui/Screen";
import { AppLearnFeed } from "@/components/learn/AppLearn";
import { articleCards } from "@/lib/learn/articles";

export const metadata: Metadata = { title: "Learn" };

export default function AppLearnPage() {
  return (
    <Screen title="LEARN">
      <AppLearnFeed articles={articleCards()} />
    </Screen>
  );
}
