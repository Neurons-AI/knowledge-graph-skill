// config.mjs — KG skill configuration management
// Provides centralized, validated config with sensible defaults.
// Config is stored in data/kg-config.json alongside the KG store.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'data', 'kg-config.json');

// ── Default Configuration ──────────────────────────────────────────────────

export const DEFAULTS = {
  summary: {
    tokenBudget: 5000,        // max tokens for kg-summary.md
    maxChildDepth: null,       // null = auto (3 for <100, 2 for 100-400, 1 for >400 entities)
    maxAttrLen: 40,            // max characters for attribute values in summary
    maxPerRoot: 4,             // max relations shown per root subtree in %key-relations
    compactThreshold: 400,     // entity count above which summary switches to compact mode
    mediumThreshold: 200,      // entity count above which summary uses medium depth
  },
  validation: {
    minEntities: 30,           // minimum entities for complex article extraction PASS
    minRelationRatio: 0.5,     // relations per entity ratio (min = max(10, entities * ratio))
    minDepth: 3,               // minimum hierarchy depth for PASS
    minEvents: 3,              // minimum event nodes for PASS
  },
  depthCheck: {
    entityCapForEstimate: 50,  // cap named entity count to avoid inflated targets
    minEntitiesMultiplier: 1.0,// multiplier for named entities → min entity target
    extraEntities: 30,         // added to minEntities for maxEntities range
  },
  consolidation: {
    autoNest: true,            // auto-nest single-relation orphans
    mergeSuggestions: true,    // suggest merges for similar labels
    pruneEmptyAttrs: true,     // remove empty/null attrs
    levenshteinThreshold: 2,   // max edit distance for merge suggestions
  },
  visualization: {
    repulsion: 5000,           // physics repulsion force between nodes
    edgeRestLength: 160,       // default edge rest length
    overlapPenalty: 3,         // multiplier for overlap penalty
    simulationSteps: 500,      // physics simulation iterations
    initialSpread: 1.5,        // initial node spread multiplier
    zoomAnimationMs: 400,      // zoom-to-node animation duration
  },
};

// ── Deep merge helper ──────────────────────────────────────────────────────

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ── Load / Save ────────────────────────────────────────────────────────────

/** Load config, merged with defaults. Always returns complete config. */
export function loadConfig() {
  let userConfig = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      userConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.warn(`⚠️  Failed to parse kg-config.json: ${e.message}. Using defaults.`);
    }
  }
  // Deep clone DEFAULTS first to prevent mutation of the constant
  const defaults = JSON.parse(JSON.stringify(DEFAULTS));
  return deepMerge(defaults, userConfig);
}

/** Save user overrides (only saves non-default values). */
export function saveConfig(config) {
  // Only persist values that differ from defaults
  const diff = getDiff(DEFAULTS, config);
  writeFileSync(CONFIG_PATH, JSON.stringify(diff, null, 2) + '\n');
  return diff;
}

/** Get diff between defaults and current config (only user overrides). */
function getDiff(defaults, current) {
  const diff = {};
  for (const key of Object.keys(current)) {
    if (!(key in defaults)) {
      diff[key] = current[key]; // unknown key, preserve it
      continue;
    }
    if (
      typeof current[key] === 'object' &&
      current[key] !== null &&
      !Array.isArray(current[key]) &&
      typeof defaults[key] === 'object'
    ) {
      const sub = getDiff(defaults[key], current[key]);
      if (Object.keys(sub).length > 0) diff[key] = sub;
    } else if (current[key] !== defaults[key]) {
      diff[key] = current[key];
    }
  }
  return diff;
}

/** Get a nested config value by dot-separated path. */
export function getConfigValue(path) {
  const config = loadConfig();
  const parts = path.split('.');
  let current = config;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/** Set a nested config value by dot-separated path. */
export function setConfigValue(path, value) {
  const config = loadConfig();
  const parts = path.split('.');
  let current = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return saveConfig(config);
}

/** Reset a nested config value to default by removing user override. */
export function resetConfigValue(path) {
  const config = loadConfig();
  const parts = path.split('.');
  let current = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof current[parts[i]] !== 'object') return;
    current = current[parts[i]];
  }
  // Get default value
  let defaultVal = DEFAULTS;
  for (const part of parts) {
    if (defaultVal === undefined) break;
    defaultVal = defaultVal[part];
  }
  current[parts[parts.length - 1]] = defaultVal;
  return saveConfig(config);
}

/** List all config keys with current values + defaults + whether overridden. */
export function listConfig() {
  const config = loadConfig();
  let userConfig = {};
  if (existsSync(CONFIG_PATH)) {
    try { userConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }

  const entries = [];
  function walk(obj, defaults, user, prefix) {
    for (const key of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      const def = defaults?.[key];
      const usr = user?.[key];

      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        walk(val, def || {}, usr || {}, path);
      } else {
        entries.push({
          path,
          value: val,
          default: def,
          overridden: usr !== undefined && usr !== def,
        });
      }
    }
  }
  walk(config, DEFAULTS, userConfig, '');
  return entries;
}

export { CONFIG_PATH };
