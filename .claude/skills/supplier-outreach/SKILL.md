# Supplier Outreach Skill

Generate personalised LinkedIn DM outreach messages for 3D printing suppliers listed on AMSupplyCheck.

## Workflow

### Step 1: Select suppliers
- Query Supabase for suppliers with good data (country, technologies, materials, description)
- Pick suppliers with geographic diversity
- Prefer suppliers with rich descriptions and multiple technologies/materials

### Step 2: Find contact person
- For each supplier, use web search to find the CEO, founder, or key leader
- Search for "[Company Name] CEO LinkedIn" or "[Company Name] founder"
- Get their **first name** and **LinkedIn profile URL**
- Present the list of contact persons to the user
- **User must confirm** which contacts they are connected with on LinkedIn before messages are written

### Step 3: Write DM messages
Use this template (no connection request message, only a DM):

```
Hi [First Name], I'm Christian from AMSupplyCheck, a free comparison platform helping engineers find 3D printing suppliers by capability.

[1 sentence about WHY their specific capabilities/business model stands out or matches enquiries on SupplyCheck].

We run a referral model where we route relevant project requests to matching suppliers. There's only a fee if it converts to a confirmed order. No upfront cost.

We've already built out your page on SupplyCheck. You can check it out here: https://amsupplycheck.com/supplier/[supplier-id]
```

### Step 4: Follow-up (after 5-7 days if no reply)
```
Hi [First Name], just circling back on my earlier message. No pressure at all. A simple yes, no, or later is fine. Happy to stay connected either way.
```

## Rules
- **Tone:** UK B2B, direct, peer-to-peer. No sales fluff. No superlatives.
- **Never use:** precise numbers/stats, dashes, or a call/meeting CTA
- **Always include:** a direct link to their SupplyCheck supplier page as the CTA
- **Always include:** the contact person's first name and their LinkedIn profile link
- **Personalise:** each message with one specific thing about their business

## Output format
For each supplier, output:
1. Company name and country
2. Contact person's first name, role, and LinkedIn profile link
3. The ready-to-send DM
4. The SupplyCheck page link
