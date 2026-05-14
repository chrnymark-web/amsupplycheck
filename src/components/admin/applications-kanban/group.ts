import type { SupplierApplication } from '@/hooks/use-supplier-applications';
import type { ApplicationStatus } from './stages';

export type CompanyGroup = {
  /** Stable key used as draggable id — derived from the canonical company name. */
  key: string;
  company: string;
  /** Most recent contact-person name (by created_at). */
  contactName: string;
  /** All underlying application row ids — every status mutation hits all of them. */
  ids: string[];
  /** Stage shown for the card = stage of the application whose status was updated most recently. */
  status: ApplicationStatus;
  /** Earliest application date — "applied N days ago". */
  firstAppliedAt: string;
  /** Latest status change across the group — "N days in stage". */
  lastStatusAt: string;
  /** Number of underlying application rows for this company. */
  count: number;
};

function canonicalKey(company: string): string {
  return company.trim().toLowerCase();
}

export function groupByCompany(applications: SupplierApplication[]): CompanyGroup[] {
  const map = new Map<string, SupplierApplication[]>();
  for (const app of applications) {
    const key = canonicalKey(app.company);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(app);
    else map.set(key, [app]);
  }

  const groups: CompanyGroup[] = [];
  for (const [key, rows] of map) {
    // status comes from the row with the most recent status_updated_at
    const latestStatusRow = rows.reduce((acc, r) =>
      new Date(r.status_updated_at) > new Date(acc.status_updated_at) ? r : acc,
    );
    // contact name from the most recently created application
    const latestCreatedRow = rows.reduce((acc, r) =>
      new Date(r.created_at) > new Date(acc.created_at) ? r : acc,
    );
    const firstApplied = rows.reduce((acc, r) =>
      new Date(r.created_at) < new Date(acc.created_at) ? r : acc,
    );

    groups.push({
      key,
      company: latestCreatedRow.company,
      contactName: latestCreatedRow.name,
      ids: rows.map(r => r.id),
      status: latestStatusRow.status,
      firstAppliedAt: firstApplied.created_at,
      lastStatusAt: latestStatusRow.status_updated_at,
      count: rows.length,
    });
  }

  // Newest activity first within each future column.
  groups.sort((a, b) => new Date(b.lastStatusAt).getTime() - new Date(a.lastStatusAt).getTime());
  return groups;
}
