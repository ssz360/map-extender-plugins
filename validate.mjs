// Validates every plugin folder before it can be published.
//
// These checks mirror what the extension enforces when it parses a fetched registry, so a
// registry that builds here will load there. Keep the two in step.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ID_PREFIX = 'extender:'
/** Where this registry is published. Screenshot URLs are checked against it. */
export const BASE_URL = process.env.REGISTRY_BASE_URL ?? 'https://ssz360.github.io/map-extender-plugins'
// fileURLToPath, not URL.pathname — the latter percent-encodes spaces in the path.
const PLUGINS_DIR = fileURLToPath(new URL('./plugins/', import.meta.url))
const SETTING_TYPES = new Set(['text', 'number', 'boolean', 'select'])

const ALL_URLS = new Set(['<all_urls>', '*://*/*'])

/** Same component-wise matcher the extension uses; a pattern it rejects would never run. */
function isValidMatchPattern(pattern) {
  const normalized = String(pattern).trim()
  if (ALL_URLS.has(normalized)) return true
  return /^(\*|https?):\/\/([^/]*)(\/.*)$/.test(normalized)
}

/**
 * Screenshots must be absolute URLs — the extension stores them verbatim and renders them from
 * whatever context it happens to be in, so a relative path has no reliable base to resolve
 * against. When the URL points at this registry's own published files, the matching file is also
 * checked on disk: a typo would otherwise publish a link that simply never loads, and nothing
 * downstream can detect that.
 */
function screenshotProblem(slug, shot) {
  if (typeof shot !== 'string' || !shot.trim()) return 'must be a non-empty string'

  let parsed
  try {
    parsed = new URL(shot)
  } catch {
    return 'must be an absolute https:// URL (relative paths are not allowed)'
  }

  if (parsed.protocol === 'data:') {
    return /^data:image\/(png|jpe?g|gif|webp|avif);/i.test(shot) ? null : 'data: URLs must be an image type'
  }
  if (parsed.protocol !== 'https:') return 'must use https:'

  const ownPrefix = `${BASE_URL}/plugins/${slug}/`
  if (shot.startsWith(ownPrefix)) {
    const relative = decodeURIComponent(shot.slice(ownPrefix.length))
    if (!existsSync(join(PLUGINS_DIR, slug, relative))) return 'does not exist on disk'
  }
  return null
}

export function validatePlugin(slug, meta, code, errors) {
  const fail = (message) => errors.push(`${slug}: ${message}`)

  if (typeof meta.id !== 'string' || !meta.id.startsWith(ID_PREFIX)) {
    fail(`id must be a string starting with "${ID_PREFIX}"`)
  }
  for (const field of ['name', 'description', 'version', 'author']) {
    if (typeof meta[field] !== 'string' || !meta[field].trim()) fail(`${field} is required`)
  }
  if (typeof meta.version === 'string' && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
    fail(`version "${meta.version}" must look like 1.0.0`)
  }

  if (!Array.isArray(meta.matchPatterns) || meta.matchPatterns.length === 0) {
    fail('matchPatterns must be a non-empty array')
  } else {
    for (const pattern of meta.matchPatterns) {
      if (!isValidMatchPattern(pattern)) fail(`match pattern "${pattern}" is not valid`)
    }
  }

  if (!Array.isArray(meta.settingsSchema)) {
    fail('settingsSchema must be an array')
  } else {
    for (const field of meta.settingsSchema) {
      if (!field || typeof field.key !== 'string') {
        fail('every setting needs a string key')
        continue
      }
      if (!SETTING_TYPES.has(field.type)) fail(`setting "${field.key}" has an invalid type`)
      if (field.default === undefined) fail(`setting "${field.key}" needs a default`)
      // Without a value here the plugin reads undefined at runtime.
      if (meta.settings?.[field.key] === undefined) {
        fail(`settings is missing a value for "${field.key}"`)
      }
      if (field.type === 'select') {
        if (!Array.isArray(field.options) || field.options.length === 0) {
          fail(`select setting "${field.key}" needs options`)
        } else if (!field.options.map(String).includes(String(field.default))) {
          fail(`select setting "${field.key}" default is not one of its options`)
        }
      }
    }
  }

  for (const shot of meta.screenshots ?? []) {
    const problem = screenshotProblem(slug, shot)
    if (problem) fail(`screenshot "${shot}" ${problem}`)
  }

  if (!code.trim()) fail('plugin.js is empty')
  // The code is injected as a source string, not loaded as a module.
  if (/^\s*(import|export)\s/m.test(code)) fail('plugin.js must not use import/export')
}

export function loadPlugins() {
  const slugs = readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const errors = []
  const loaded = []
  const seenIds = new Set()

  for (const slug of slugs) {
    const metaPath = join(PLUGINS_DIR, slug, 'plugin.json')
    const codePath = join(PLUGINS_DIR, slug, 'plugin.js')
    if (!existsSync(metaPath) || !existsSync(codePath)) {
      errors.push(`${slug}: needs both plugin.json and plugin.js`)
      continue
    }

    let meta
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    } catch (err) {
      errors.push(`${slug}: plugin.json is not valid JSON — ${err.message}`)
      continue
    }
    const code = readFileSync(codePath, 'utf8')

    validatePlugin(slug, meta, code, errors)
    if (seenIds.has(meta.id)) errors.push(`${slug}: duplicate id ${meta.id}`)
    seenIds.add(meta.id)

    loaded.push({ slug, meta, code })
  }

  return { loaded, errors }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { loaded, errors } = loadPlugins()
  for (const error of errors) console.error(`  ✗ ${error}`)
  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) in ${loaded.length} plugin(s)`)
    process.exit(1)
  }
  console.log(`✓ ${loaded.length} plugins valid`)
}
