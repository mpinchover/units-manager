import { proxyFile } from "@/lib/api";

/** Download the latest PDF version of a lease. */
export async function GET(request: Request, { params }: RouteContext<"/api/leases/[id]/pdf">) {
  const { id } = await params;
  return proxyFile(`/leases/${encodeURIComponent(id)}/pdf`, new URL(request.url).search);
}
