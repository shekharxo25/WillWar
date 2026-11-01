import { requireUser } from "@/lib/server/auth";
import { fail } from "@/lib/server/http";
import { limited } from "@/lib/server/rate-limit";

/** POST /api/account/export: the caller's own rows as a JSON download (export_my_data RPC, RLS-safe). */
export async function POST(req: Request) {
  const tooMany = limited(req, "export", 5);
  if (tooMany) return tooMany;
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const { data, error } = await auth.sb.rpc("export_my_data");
  if (error || !data) return fail("export_failed", 500);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="willwar-export-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}
