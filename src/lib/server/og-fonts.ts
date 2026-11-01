import "server-only";

/**
 * Loads a font for next/og images. Node (dev, build, `next start`) reads it from public/og/;
 * Cloudflare Workers have no filesystem, so they fetch it through the static ASSETS binding.
 */
export async function loadOgFont(name: "LeagueGothic.woff" | "DSEG7.woff"): Promise<ArrayBuffer> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const buf = await readFile(join(process.cwd(), "public/og", name));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const assets = (env as unknown as { ASSETS: { fetch: (u: string) => Promise<Response> } }).ASSETS;
    const res = await assets.fetch(`https://assets.local/og/${name}`);
    if (!res.ok) throw new Error(`og_font_${res.status}`);
    return res.arrayBuffer();
  }
}
