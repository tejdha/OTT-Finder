export const COUNTRY_TO_ISO = {
  "India": "IN",
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",

  "New Zealand": "NZ",

  "Germany": "DE",
  "France": "FR",
  "Italy": "IT",
  "Spain": "ES",
  "Netherlands": "NL",
  "Belgium": "BE",
  "Switzerland": "CH",
  "Austria": "AT",
  "Ireland": "IE",
  "Portugal": "PT",
  "Poland": "PL",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",

  "Brazil": "BR",
  "Mexico": "MX",
  "Argentina": "AR",
  "Chile": "CL",
  "Colombia": "CO",

  "Japan": "JP",
  "South Korea": "KR",
  "Singapore": "SG",
  "Indonesia": "ID",
  "Malaysia": "MY",
  "Thailand": "TH",
  "Philippines": "PH",
  "Taiwan": "TW",
  "Hong Kong": "HK",

  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  "South Africa": "ZA",
  "Turkey": "TR",
  "Israel": "IL",
};

export const ALL_COUNTRIES = Object.keys(COUNTRY_TO_ISO);

export const DEFAULT_REGION = "IN";

export function toIsoRegion(countryName) {
  return COUNTRY_TO_ISO[countryName] || DEFAULT_REGION;
}
