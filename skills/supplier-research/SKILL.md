---
name: supplier-research
description: >
  Research 3D printing suppliers by scraping their websites with Firecrawl.
  Use this skill whenever the user wants to research suppliers, gather info about
  3D printing companies, extract capabilities from supplier websites, or prepare
  data before writing outreach messages. Triggers on: "research suppliers",
  "scrape supplier websites", "find out about these suppliers", "what do these
  companies do", "gather supplier info", or when given a list of supplier URLs
  or a Trello JSON export to investigate.
---

# Supplier Research

Research 3D printing suppliers by scraping their websites and extracting structured capability data. This is the foundation for outreach, supplier comparison, and adding new suppliers to SupplyCheck.

## When to use

- User provides supplier URLs (directly or from a Trello board export)
- User asks to "research", "look up", or "find out about" suppliers
- User wants to prepare data before writing outreach messages
- User is evaluating whether suppliers are a good fit for SupplyCheck

## Input formats

The skill handles two input formats:

### 1. Direct URLs
The user gives you one or more supplier website URLs.

### 2. Trello JSON export
The user provides a Trello board JSON file (exported from the Suppliers board). Extract supplier URLs from cards using this logic:

```
- Card name IS a URL → use it directly
- Card description contains "Website: <url>" → use that URL
- Card name is a company name with no URL anywhere → search for it or ask the user
```

Also extract from each Trello card:
- **CEO/Leader name + LinkedIn** (from card description, format: `CEO/Leader: Name - LinkedIn URL`)
- **Which Trello list the card is in** (to understand pipeline stage)
- **Labels** (if any)

## How to research

Use Firecrawl's JSON extraction to scrape each supplier website. Run all scrapes in parallel — don't wait for one to finish before starting the next.

For each supplier, call `mcp__firecrawl__firecrawl_scrape` with:
- `url`: the supplier's website
- `formats`: `["json"]`
- `waitFor`: `5000` (many supplier sites are JS-rendered)
- `jsonOptions`:
  ```json
  {
    "prompt": "Extract all information about this 3D printing / manufacturing company: company name, headquarters location, technologies offered, materials they work with, industries they serve, services they provide, and what makes them unique or different",
    "schema": {
      "type": "object",
      "properties": {
        "company_name": { "type": "string" },
        "location": { "type": "string" },
        "technologies": { "type": "array", "items": { "type": "string" } },
        "materials": { "type": "array", "items": { "type": "string" } },
        "industries": { "type": "array", "items": { "type": "string" } },
        "services": { "type": "array", "items": { "type": "string" } },
        "unique_selling_points": { "type": "array", "items": { "type": "string" } },
        "description": { "type": "string" }
      }
    }
  }
  ```

## Fit assessment

After scraping, assess whether each supplier is a **good fit for SupplyCheck's referral model**. SupplyCheck routes project requests from engineers to 3D printing service providers. A supplier is a good fit if they:

- Actually provide 3D printing / additive manufacturing **services** (not just sell printers or accessories)
- Accept project enquiries from external customers
- Have identifiable technologies and materials

Flag suppliers that are **not a fit**, for example:
- Printer manufacturers that only sell hardware (e.g., BigRep, Prusa — unless they also offer print services)
- Accessory/consumable companies (e.g., air filtration, filament-only sellers)
- Software-only companies
- Companies that only serve internal/captive demand

Be specific about why a supplier doesn't fit — don't just say "bad fit", explain what they actually do.

## Output format

Present results as a structured summary per supplier:

```
### [Company Name] — [Location]
- **Website:** [url]
- **Fit for SupplyCheck:** ✅ Good fit / ⚠️ Partial fit / ❌ Not a fit — [reason]
- **Technologies:** [list]
- **Materials:** [list]
- **Industries:** [list]
- **Services:** [list]
- **Unique selling points:** [list]
- **CEO/Leader:** [name] (if known from Trello data)
- **Pipeline stage:** [Trello list name] (if from Trello)
```

If the scrape returns empty or minimal data (sometimes happens with heavy JS sites), note this and suggest trying the `/about` or `/services` page as a follow-up.
