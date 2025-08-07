/**
 * Maps normalised property fields to possible keys for each boundary type.
 * Ensures normalisation is adaptable to varying property names in different GeoJSON sources.
 */
const PROPERTY_MAP = {
  state: {
    name: ['NAME', 'state', 'name'],
    code: ['ID', 'code_state', 'ISO_CODE'],
    population: ['TOTPOP_CY', 'population'],
    area: ['AREA', 'Shape__Area', 'Shape_Area', 'area'],
    state: ['NAME', 'state', 'NAME_STATE']
  },
  district: {
    name: ['NAME', 'district', 'name'],
    code: ['ID', 'code_district'],
    state: ['state', 'STATE', 'Negeri', 'NAME_STATE'],
    population: ['TOTPOP_CY', 'population'],
    area: ['AREA', 'Shape__Area', 'Shape_Area', 'area']
  },
  subdistrict: {
    name: ['NAME', 'subdistrict', 'name'],
    code: ['ID', 'code_subdistrict'],
    district: ['district', 'DISTRICT', 'NAME_DISTRICT'],
    state: ['state', 'STATE', 'Negeri', 'NAME_STATE'],
    population: ['TOTPOP_CY', 'population'],
    area: ['AREA', 'Shape__Area', 'Shape_Area', 'area']
  },
  parlimen: {
    name: ['PARLIMEN', 'Parliame_2', 'Parliament', 'KODPAR'],
    code: ['KODPAR'],
    state: ['NEGERI', 'Negeri', 'state', 'STATE'],
    area: ['KELUASAN_S', 'Shape__Area', 'SHAPE_Area', 'area']
  },
  dun: {
    name: ['NAMADUNA', 'NAMADUNC', 'name'],
    code: ['KODDUNA', 'KODDUNC', 'KODDUN'],
    parlimen: ['KODPAR'],
    state: ['Negeri', 'state', 'STATE'],
    area: ['LUAS', 'Shape__Area', 'SHAPE_Area', 'area'],
    population: ['PENDUDUK', 'population']
  }
};

/**
 * Returns the first available property value from a list of possible keys.
 * Skips undefined and empty string values.
 * @param {object} properties - Raw properties object from GeoJSON feature
 * @param {string[]} keys - Array of possible property keys
 * @returns {any} The first non-empty property value found, or undefined
 */
function getFirstAvailable(properties, keys) {
  for (const key of keys) {
    if (properties[key] !== undefined && properties[key] !== '') {
      return properties[key];
    }
  }
  return undefined;
}

/**
 * Normalises GeoJSON feature properties for different boundary types.
 * Ensures consistent access to 'name', 'code', 'state', and other common fields.
 * Uses PROPERTY_MAP for adaptable key mapping.
 * @param {string} type - Boundary type: 'state', 'district', 'subdistrict', 'parlimen', 'dun'
 * @param {object} properties - Raw properties from GeoJSON feature
 * @returns {object} Normalised properties
 */
export function normaliseProperties(type, properties) {
  const map = PROPERTY_MAP[type];
  if (!map) return { raw: properties };

  const normalised = {};
  for (const field in map) {
    normalised[field] = getFirstAvailable(properties, map[field]);
  }
  normalised.raw = properties;
  return normalised;
}

/**
 * Utility to get the display name for a feature, given its type.
 * @param {string} type - Boundary type
 * @param {object} properties - Raw properties from GeoJSON feature
 * @returns {string|undefined} Normalised name property
 */
export function getFeatureName(type, properties) {
  return normaliseProperties(type, properties).name;
}

/**
 * Utility to get the code for a feature, given its type.
 * @param {string} type - Boundary type
 * @param {object} properties - Raw properties from GeoJSON feature
 * @returns {string|undefined} Normalised code property
 */
export function getFeatureCode(type, properties) {
  return normaliseProperties(type, properties).code;
}