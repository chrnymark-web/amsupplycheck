// Sync supplier_technologies and supplier_materials junction-table rows
// from the canonical slug arrays stored on suppliers.{technologies,materials}.
//
// Why this exists: SupplierProfile.tsx (the live /suppliers/:slug page)
// reads from the junction tables joined to technologies/materials master,
// not from the denormalized text[] arrays on the supplier row. Validation
// pipelines that update only the arrays leave the junction stale, so audit
// findings never reach the page.
//
// Behavior:
//   - DELETE existing junction rows for the supplier
//   - INSERT one row per slug that resolves to a non-hidden master row
//   - Slugs with no matching master row are silently dropped (logged)

// deno-lint-ignore-file no-explicit-any

export interface JunctionSyncResult {
  technologies: { matched: string[]; unmatched: string[] };
  materials: { matched: string[]; unmatched: string[] };
}

export async function syncSupplierJunctions(
  supabase: any,
  supplierUuid: string,
  techSlugs: string[] | null | undefined,
  matSlugs: string[] | null | undefined,
): Promise<JunctionSyncResult> {
  const result: JunctionSyncResult = {
    technologies: { matched: [], unmatched: [] },
    materials: { matched: [], unmatched: [] },
  };

  if (techSlugs !== undefined && techSlugs !== null) {
    const slugs = Array.from(new Set(techSlugs.filter(Boolean)));
    const { data: techRows, error: techLookupError } = await supabase
      .from('technologies')
      .select('id, slug')
      .in('slug', slugs.length > 0 ? slugs : ['__never__'])
      .or('hidden.is.null,hidden.eq.false');

    if (techLookupError) {
      console.error('❌ junction-sync: technologies lookup failed', techLookupError);
    } else {
      const matchedSlugs = new Set((techRows || []).map((r: any) => r.slug));
      result.technologies.matched = slugs.filter(s => matchedSlugs.has(s));
      result.technologies.unmatched = slugs.filter(s => !matchedSlugs.has(s));

      const { error: delError } = await supabase
        .from('supplier_technologies')
        .delete()
        .eq('supplier_id', supplierUuid);
      if (delError) console.error('❌ junction-sync: supplier_technologies delete failed', delError);

      if (techRows && techRows.length > 0) {
        const rows = techRows.map((r: any) => ({ supplier_id: supplierUuid, technology_id: r.id }));
        const { error: insError } = await supabase
          .from('supplier_technologies')
          .upsert(rows, { onConflict: 'supplier_id,technology_id', ignoreDuplicates: true });
        if (insError) console.error('❌ junction-sync: supplier_technologies insert failed', insError);
      }
    }
  }

  if (matSlugs !== undefined && matSlugs !== null) {
    const slugs = Array.from(new Set(matSlugs.filter(Boolean)));
    const { data: matRows, error: matLookupError } = await supabase
      .from('materials')
      .select('id, slug')
      .in('slug', slugs.length > 0 ? slugs : ['__never__'])
      .or('hidden.is.null,hidden.eq.false');

    if (matLookupError) {
      console.error('❌ junction-sync: materials lookup failed', matLookupError);
    } else {
      const matchedSlugs = new Set((matRows || []).map((r: any) => r.slug));
      result.materials.matched = slugs.filter(s => matchedSlugs.has(s));
      result.materials.unmatched = slugs.filter(s => !matchedSlugs.has(s));

      const { error: delError } = await supabase
        .from('supplier_materials')
        .delete()
        .eq('supplier_id', supplierUuid);
      if (delError) console.error('❌ junction-sync: supplier_materials delete failed', delError);

      if (matRows && matRows.length > 0) {
        const rows = matRows.map((r: any) => ({ supplier_id: supplierUuid, material_id: r.id }));
        const { error: insError } = await supabase
          .from('supplier_materials')
          .upsert(rows, { onConflict: 'supplier_id,material_id', ignoreDuplicates: true });
        if (insError) console.error('❌ junction-sync: supplier_materials insert failed', insError);
      }
    }
  }

  const t = result.technologies;
  const m = result.materials;
  if (t.unmatched.length > 0 || m.unmatched.length > 0) {
    console.log(
      `⚠️ junction-sync: ${supplierUuid} dropped unmatched slugs — ` +
      `tech: [${t.unmatched.join(', ')}], mat: [${m.unmatched.join(', ')}]`,
    );
  }
  console.log(
    `✅ junction-sync: ${supplierUuid} synced ` +
    `${t.matched.length} tech (${t.unmatched.length} dropped), ` +
    `${m.matched.length} mat (${m.unmatched.length} dropped)`,
  );

  return result;
}
