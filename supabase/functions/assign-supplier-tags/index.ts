import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tag matching rules based on description keywords, technologies, materials, and flags
const tagRules: Record<string, {
  keywords?: string[];
  technologies?: string[];
  materials?: string[];
  flags?: string[];
}> = {
  // Industry tags
  'aerospace': {
    keywords: ['aerospace', 'aviation', 'aircraft', 'space', 'satellite', 'rocket', 'as9100', 'nadcap'],
  },
  'automotive': {
    keywords: ['automotive', 'vehicle', 'car ', 'cars ', 'motor', 'iatf', 'iatf 16949'],
  },
  'medical': {
    keywords: ['medical', 'healthcare', 'biomedical', 'surgical', 'implant', 'prosthetic', 'orthopedic', 'iso 13485', 'fda'],
  },
  'dental': {
    keywords: ['dental', 'dentistry', 'orthodontic', 'crown', 'denture'],
  },
  'defense': {
    keywords: ['defense', 'defence', 'military', 'itar', 'dod', 'department of defense'],
  },
  'electronics': {
    keywords: ['electronics', 'electronic', 'pcb', 'circuit', 'semiconductor', 'iot'],
  },
  'energy': {
    keywords: ['energy', 'oil and gas', 'oil & gas', 'power generation', 'turbine', 'wind energy', 'solar'],
  },
  'consumer-products': {
    keywords: ['consumer', 'retail', 'fashion', 'lifestyle', 'wearable', 'jewelry', 'jewellery'],
  },
  'architecture': {
    keywords: ['architecture', 'architectural', 'construction', 'building', 'interior design'],
  },
  'industrial': {
    keywords: ['industrial', 'tooling', 'jigs', 'fixtures', 'manufacturing aid'],
  },
  // Capability tags
  'instant-quoting': {
    flags: ['has_instant_quote'],
    keywords: ['instant quote', 'online quote', 'instant pricing', 'auto-quote', 'get a quote online'],
  },
  'fast-turnaround': {
    flags: ['has_rush_service'],
    keywords: ['fast turnaround', 'rapid delivery', 'rush', 'express', 'next day', 'same day', '24 hour', '48 hour', 'quick turnaround'],
  },
  'metal-specialist': {
    technologies: ['dmls', 'slm', 'ebm', 'ded', 'wire-arc', 'metal-fdm', 'metal-binder-jetting', 'metal-extrusion'],
    materials: ['titanium', 'stainless-steel', 'aluminum', 'aluminium', 'inconel', 'cobalt', 'tool-steel', 'maraging-steel', 'copper', 'tungsten', 'platinum', 'gold', 'titanium-ti-6al-4v', 'stainless-steel-316l', 'stainless-steel-17-4ph', 'inconel-625', 'inconel-718'],
    keywords: ['metal 3d printing', 'metal additive', 'metal parts', 'metal specialist', 'metal manufacturing'],
  },
  'prototype-specialist': {
    keywords: ['prototype', 'prototyping', 'rapid prototype', 'concept model', 'proof of concept', 'design iteration'],
  },
  'production-runs': {
    keywords: ['production run', 'series production', 'batch production', 'mass production', 'production-grade', 'end-use parts', 'serial production'],
  },
  'high-volume': {
    keywords: ['high volume', 'high-volume', 'mass production', 'large batch', 'thousands of parts', 'scalable production'],
  },
  'low-volume': {
    keywords: ['low volume', 'low-volume', 'small batch', 'small series', 'short run', 'on-demand'],
  },
  'large-format': {
    keywords: ['large format', 'large-format', 'large scale', 'large-scale', 'big area', 'oversized', 'large parts', 'large build'],
  },
  'post-processing': {
    keywords: ['post-processing', 'finishing', 'surface treatment', 'painting', 'polishing', 'anodizing', 'plating', 'dyeing', 'vapor smoothing', 'machining'],
  },
  'design-support': {
    keywords: ['design support', 'design for', 'dfam', 'design consultation', 'engineering support', 'design optimization', 'co-creation', 'design assistance'],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all tags and suppliers
    const [tagsRes, suppliersRes, existingRes] = await Promise.all([
      supabase.from('tags').select('id, slug'),
      supabase.from('suppliers').select('id, name, description, technologies, materials, has_rush_service, has_instant_quote'),
      supabase.from('supplier_tags').select('supplier_id, tag_id'),
    ]);

    if (tagsRes.error) throw tagsRes.error;
    if (suppliersRes.error) throw suppliersRes.error;

    const tags = tagsRes.data;
    const suppliers = suppliersRes.data;
    const existingPairs = new Set(
      (existingRes.data || []).map((r: any) => `${r.supplier_id}:${r.tag_id}`)
    );

    const tagMap = new Map(tags.map((t: any) => [t.slug, t.id]));
    const inserts: { supplier_id: string; tag_id: string }[] = [];

    for (const supplier of suppliers) {
      const desc = (supplier.description || '').toLowerCase();
      const techs = (supplier.technologies || []).map((t: string) => t.toLowerCase());
      const mats = (supplier.materials || []).map((m: string) => m.toLowerCase());

      for (const [tagSlug, rules] of Object.entries(tagRules)) {
        const tagId = tagMap.get(tagSlug);
        if (!tagId) continue;

        let matched = false;

        // Check flags
        if (rules.flags) {
          for (const flag of rules.flags) {
            if (flag === 'has_instant_quote' && supplier.has_instant_quote) matched = true;
            if (flag === 'has_rush_service' && supplier.has_rush_service) matched = true;
          }
        }

        // Check keywords in description
        if (!matched && rules.keywords) {
          matched = rules.keywords.some(kw => desc.includes(kw.toLowerCase()));
        }

        // Check technologies
        if (!matched && rules.technologies) {
          matched = rules.technologies.some(t => techs.includes(t));
        }

        // Check materials (need at least 2 metal materials for metal-specialist)
        if (!matched && rules.materials && tagSlug === 'metal-specialist') {
          const metalCount = rules.materials.filter(m => mats.includes(m)).length;
          matched = metalCount >= 2;
        } else if (!matched && rules.materials) {
          matched = rules.materials.some(m => mats.includes(m));
        }

        if (matched) {
          const key = `${supplier.id}:${tagId}`;
          if (!existingPairs.has(key)) {
            inserts.push({ supplier_id: supplier.id, tag_id: tagId });
            existingPairs.add(key);
          }
        }
      }
    }

    // Batch insert
    let inserted = 0;
    const batchSize = 500;
    for (let i = 0; i < inserts.length; i += batchSize) {
      const batch = inserts.slice(i, i + batchSize);
      const { error } = await supabase.from('supplier_tags').insert(batch);
      if (error) throw error;
      inserted += batch.length;
    }

    // Summary by tag
    const summary: Record<string, number> = {};
    for (const ins of inserts) {
      const slug = [...tagMap.entries()].find(([, id]) => id === ins.tag_id)?.[0] || 'unknown';
      summary[slug] = (summary[slug] || 0) + 1;
    }

    return new Response(JSON.stringify({
      success: true,
      inserted,
      suppliers_analyzed: suppliers.length,
      summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
