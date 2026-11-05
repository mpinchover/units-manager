/** API mode data source: every call goes through a Server Action to the Flask server. */
import * as server from "@/app/actions/api-source";
import type { DataSource } from "./types";

export const apiSource: DataSource = {
  load: () => server.apiLoad(),
  saveBuilding: (id, v) => server.apiSaveBuilding(id, v),
  deleteBuilding: (id) => server.apiDeleteBuilding(id),
  saveUnit: (id, v) => server.apiSaveUnit(id, v),
  deleteUnit: (id) => server.apiDeleteUnit(id),
  saveTenant: (id, v) => server.apiSaveTenant(id, v),
  deleteTenant: (id) => server.apiDeleteTenant(id),
  templateInfo: () => server.apiTemplateInfo(),
  previewLease: (p, id) => server.apiPreviewLease(p, id),
  saveLease: (p, id) => server.apiSaveLease(p, id),
  async downloadPdf(leaseId, version) {
    // PDFs stream through the Next.js route handlers in app/api/leases (they add the session).
    const a = document.createElement("a");
    a.href = version ? `/api/leases/${leaseId}/documents/${version}` : `/api/leases/${leaseId}/pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { ok: true, data: null };
  },
};
