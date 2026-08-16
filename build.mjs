// Assembles plugins/* into a single registry.json for publishing.
//
// Everything is inlined into one file on purpose: one fetch, one thing to validate, and no
// half-updated state if a later request fails.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadPlugins } from './validate.mjs'

const OUT = fileURLToPath(new URL('./registry.json', import.meta.url))

// Screenshots are stored beside each plugin and published with the repo; rewrite the relative
// paths to absolute URLs so the extension can render them from anywhere.
const BASE_URL = process.env.REGISTRY_BASE_URL ?? 'https://REPLACE-ME.github.io/map-extender-plugins'

function absoluteScreenshots(slug, screenshots) {
  return (screenshots ?? []).map((shot) =>
    /^(https:|data:)/.test(shot) ? shot : `${BASE_URL}/plugins/${slug}/${shot.replace(/^\.\//, '')}`,
  )
}

const { loaded, errors } = loadPlugins()

if (errors.length > 0) {
  for (const error of errors) console.error(`  ✗ ${error}`)
  console.error(`\nRefusing to build: ${errors.length} problem(s).`)
  process.exit(1)
}

const registry = {
  formatVersion: 1,
  name: 'Map Extender Plugins',
  description: 'Community plugins for the Map Extender browser extension.',
  homepage: BASE_URL,
  updatedAt: new Date().toISOString().slice(0, 10),
  plugins: loaded.map(({ slug, meta, code }) => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    version: meta.version,
    author: meta.author,
    ...(meta.homepage ? { homepage: meta.homepage } : {}),
    ...(meta.usage ? { usage: meta.usage } : {}),
    matchPatterns: meta.matchPatterns,
    settingsSchema: meta.settingsSchema,
    settings: meta.settings,
    screenshots: absoluteScreenshots(slug, meta.screenshots),
    code,
  })),
}

writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n')

const bytes = Buffer.byteLength(JSON.stringify(registry))
console.log(`✓ registry.json — ${registry.plugins.length} plugins, ${(bytes / 1024).toFixed(1)} kB`)
if (BASE_URL.includes('REPLACE-ME')) {
  console.warn('  ! REGISTRY_BASE_URL is unset — screenshot URLs will not resolve.')
}
