"use client";

import Link from "next/link";
import { Cell, InsetGroup } from "@/components/ui/List";
import type { CrisisResource } from "@/lib/config/crisis-resources";

/** The static crisis card (ai-safety.md). Numbers come from config, never from a model. */
export function CrisisCard({
  resources,
  warChestRelease,
  under18,
}: {
  resources: CrisisResource[];
  warChestRelease?: boolean;
  under18?: boolean;
}) {
  return (
    <section className="rounded-sheet bg-surface p-5" role="alert">
      <p className="text-body">
        It sounds like you&apos;re carrying a lot right now. You deserve support from a real person. You can reach someone
        now:
      </p>
      <InsetGroup className="mt-4">
        {resources.map((r) => (
          <Cell key={r.id} title={r.name} subtitle={r.detail} href={r.href} external chevron={false} value={<span className="text-tide">{r.linkLabel}</span>} />
        ))}
        <Cell title="In immediate danger" subtitle="Call your local emergency number" chevron={false} />
      </InsetGroup>
      {warChestRelease && (
        <p className="mt-4 text-body">
          Your War Chest can wait.{" "}
          <Link href="/support#war-chest" className="text-tide">
            Want your money back now?
          </Link>
        </p>
      )}
      {under18 && <p className="mt-4 text-body">WillWar is for adults. Your account will be closed.</p>}
    </section>
  );
}
