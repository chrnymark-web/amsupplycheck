// Country → continent mapping used for area-based supplier filtering.
// Kept in sync with src/lib/supplierData.ts countryToAreaMap — extend both
// if you add a new country.

const COUNTRY_TO_AREA: Record<string, string> = {
  // Europe
  Germany: "Europe", Denmark: "Europe", Netherlands: "Europe", Sweden: "Europe",
  Belgium: "Europe", "United Kingdom": "Europe", France: "Europe", Italy: "Europe",
  Spain: "Europe", Poland: "Europe", "Czech Republic": "Europe", Austria: "Europe",
  Switzerland: "Europe", Finland: "Europe", Norway: "Europe", Ireland: "Europe",
  Malta: "Europe",

  // North America
  "United States": "North America", USA: "North America", US: "North America",
  Canada: "North America", Mexico: "North America",

  // Asia
  China: "Asia", Japan: "Asia", "South Korea": "Asia", India: "Asia",
  Singapore: "Asia", Taiwan: "Asia", "Hong Kong": "Asia", Thailand: "Asia",
  Malaysia: "Asia", Philippines: "Asia", Indonesia: "Asia", Vietnam: "Asia",
  Pakistan: "Asia",

  // Oceania
  Australia: "Oceania", "New Zealand": "Oceania",

  // South America
  Brazil: "South America", Argentina: "South America", Chile: "South America",
  Colombia: "South America", Peru: "South America",

  // Africa
  "South Africa": "Africa", Egypt: "Africa", Nigeria: "Africa", Kenya: "Africa",
  Morocco: "Africa", Tunisia: "Africa",
};

export function getAreaForCountry(country: string | null | undefined): string | undefined {
  if (!country) return undefined;
  return COUNTRY_TO_AREA[country.trim()];
}
