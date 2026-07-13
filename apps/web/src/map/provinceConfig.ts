// The .geojson file is loaded as JSON via the custom `geojsonPlugin` in
// vite.config.ts (Vite's built-in JSON plugin only handles .json files).
import rawProvinces from '../../../../data/geo/china_provinces.geojson'

/**
 * Strip administrative suffixes from full province names so that
 * "陕西省" -> "陕西", "西藏自治区" -> "西藏", "香港特别行政区" -> "香港", etc.
 * Longer suffixes are matched first to avoid partial stripping.
 */
function normalizeProvinceName(name: string): string {
  if (!name) return name
  return name
    .replace(/特别行政区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '')
}

// The source GeoJSON contains 35 features: 34 provinces plus a nine-dash-line
// feature with an empty name. Filter that out and normalize every province name
// to its short form so downstream lookups (creature province field, UI labels)
// match consistently.
/* eslint-disable @typescript-eslint/no-explicit-any */
const raw = rawProvinces as any
const features = raw.features
  .filter((f: any) => f.properties?.name)
  .map((f: any) => ({
    ...f,
    properties: {
      ...f.properties,
      name: normalizeProvinceName(f.properties.name as string),
    },
  }))

export const provinces = { ...raw, features }

export const PROVINCE_STYLE = {
  idle: { color: '#3a3220', weight: 1, fillOpacity: 0.35 },
  hover: { color: '#b8924a', weight: 2, fillOpacity: 0.6 },
  active: { color: '#a8332a', weight: 2, fillOpacity: 0.7 },
} as const
