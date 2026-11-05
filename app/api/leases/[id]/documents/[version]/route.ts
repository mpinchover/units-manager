import { proxyFile } from "@/lib/api";

/** Download a specific lease PDF version (private; the API checks ownership). */
export async function GET(request: Request, { params }: RouteContext<"/api/leases/[id]/documents/[version]">) {
  const { id, version } = await params;
  return proxyFile(`/leases/${encodeURIComponent(id)}/documents/${encodeURIComponent(version)}`, new URL(request.url).search);
}
