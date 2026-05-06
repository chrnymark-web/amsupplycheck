---
description: Onboard a new paying SupplyCheck partner from a Google Form submission. Phone-friendly wrapper around the supplier-onboarding skill.
---

Onboard a new paying supplier as a SupplyCheck partner.

Input from user: `$ARGUMENTS`

This input is either:
- A Google Form ID or full Forms URL (preferred — pulls latest response)
- A supplier name only (then ask the user for the form ID before proceeding)

**Invoke the `supplier-onboarding` skill** to run the full onboarding workflow:
- Verify `gws auth status` shows the form-owning account (`supplycheckio@gmail.com`)
- Read form responses via the `gws` CLI
- Map fields, disambiguate against existing rows
- Create or upgrade the supplier with `is_partner = TRUE`, `verified = TRUE`
- Populate junction tables (`supplier_technologies`, `supplier_materials`, `supplier_certifications`)
- Ship as a Supabase migration committed and pushed to `main`

Do not run this in `/loop` or autonomous mode — paying clients require human confirmation at the disambiguation and verification steps.
