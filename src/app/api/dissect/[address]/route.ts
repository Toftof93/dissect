import { cachedDissect } from "@/lib/cached";

export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const r = await cachedDissect(address);
  return Response.json(r, { status: r.ok ? 200 : 400, headers: { "cache-control": "public, s-maxage=300" } });
}
