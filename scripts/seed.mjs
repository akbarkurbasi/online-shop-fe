#!/usr/bin/env node
/**
 * Seed script for VOLT — pushes mockdata.json into the backend.
 *
 * USAGE:
 *   ADMIN_TOKEN=<your_bearer_token> node scripts/seed.mjs
 *
 * OPTIONAL ENV:
 *   API_URL       — backend base (default: http://127.0.0.1:8000)
 *   DATA_FILE     — override path to JSON (default: ./mockdata.json)
 *   DRY_RUN       — set to "1" to log requests without sending
 *   FAIL_FAST     — set to "1" to abort on the first error
 *
 * Endpoints hit (same as components/admin/* use via adminService):
 *   POST {API_URL}/api/v1/categories
 *   POST {API_URL}/api/v1/products
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
const TOKEN = process.env.ADMIN_TOKEN
const DATA_FILE = process.env.DATA_FILE || resolve(ROOT, 'mockdata.json')
const DRY_RUN = process.env.DRY_RUN === '1'
const FAIL_FAST = process.env.FAIL_FAST === '1'

// ── helpers ──────────────────────────────────────────────────────────────────
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  step: (msg) => console.log(`${colors.cyan}▸${colors.reset} ${msg}`),
  ok: (msg) => console.log(`  ${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`  ${colors.yellow}!${colors.reset} ${msg}`),
  fail: (msg) => console.log(`  ${colors.red}✗${colors.reset} ${msg}`),
  dim: (msg) => console.log(`  ${colors.dim}${msg}${colors.reset}`),
  banner: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}`),
}

async function request(method, path, body) {
  const url = `${API_URL}${path}`
  if (DRY_RUN) {
    log.dim(`[DRY] ${method} ${url}`)
    return { ok: true, status: 200, data: null }
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { ok: res.ok, status: res.status, data }
}

function summarize(item) {
  if (!item) return ''
  if (typeof item === 'object' && 'message' in item) return item.message
  return JSON.stringify(item).slice(0, 200)
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  log.banner('▣ VOLT seed')
  log.dim(`API_URL  = ${API_URL}`)
  log.dim(`DATA_FILE= ${DATA_FILE}`)
  log.dim(`DRY_RUN  = ${DRY_RUN ? 'yes' : 'no'}`)
  log.dim(`FAIL_FAST= ${FAIL_FAST ? 'yes' : 'no'}`)

  if (!TOKEN && !DRY_RUN) {
    log.fail('Missing ADMIN_TOKEN env var. Export it from the admin auth-token cookie or your login response.')
    log.dim('Example: ADMIN_TOKEN=eyJhbGc... node scripts/seed.mjs')
    process.exit(1)
  }

  // Read seed file
  let seed
  try {
    const raw = await readFile(DATA_FILE, 'utf-8')
    seed = JSON.parse(raw)
  } catch (e) {
    log.fail(`Could not read ${DATA_FILE}: ${e.message}`)
    process.exit(1)
  }

  const categories = seed.categories || []
  const products = seed.products || []
  log.dim(`Loaded ${categories.length} categories, ${products.length} products, ${(seed.articles || []).length} articles`)

  // ── 1. Categories ──────────────────────────────────────────────────────────
  log.banner(`▣ 01 — Categories (${categories.length})`)
  const categoryIdMap = new Map() // slug → backend-assigned id (fallback: original id)
  const createdCategories = []
  const failedCategories = []

  for (const cat of categories) {
    const payload = { name: cat.name, slug: cat.slug }
    const { ok, status, data } = await request('POST', '/api/v1/categories', payload)

    if (ok) {
      // Backend usually returns { id, ... } or { data: { id, ... } }
      const returnedId = data?.id || data?.data?.id || cat.id
      categoryIdMap.set(cat.slug, returnedId)
      createdCategories.push({ ...cat, backendId: returnedId })
      log.ok(`${cat.name.padEnd(15)} → ${returnedId}`)
    } else if (status === 409) {
      // Already exists — keep original id and continue
      categoryIdMap.set(cat.slug, cat.id)
      log.warn(`${cat.name.padEnd(15)} → already exists (skipped)`)
    } else {
      failedCategories.push({ cat, status, data })
      log.fail(`${cat.name.padEnd(15)} → ${status} ${summarize(data)}`)
      if (FAIL_FAST) process.exit(1)
    }
  }

  // ── 2. Products ────────────────────────────────────────────────────────────
  log.banner(`▣ 02 — Products (${products.length})`)
  const createdProducts = []
  const failedProducts = []

  for (const product of products) {
    // Try slug first; some backends accept ID — adjust here if your backend wants the UUID:
    //   category: categoryIdMap.get(product.category) || product.category
    const payload = {
      ...product,
      category: product.category, // keep the slug — adminService.createProduct on the frontend sends it this way too
      // Coerce nullable fields to undefined where appropriate
      originalPrice: product.originalPrice ?? undefined,
    }

    const { ok, status, data } = await request('POST', '/api/v1/products', payload)
    if (ok) {
      const returnedId = data?.id || data?.data?.id || product.id
      createdProducts.push({ ...product, backendId: returnedId })
      log.ok(`${product.name.padEnd(40)} → ${returnedId}`)
    } else if (status === 409) {
      log.warn(`${product.name.padEnd(40)} → already exists (skipped)`)
    } else {
      failedProducts.push({ product, status, data })
      log.fail(`${product.name.padEnd(40)} → ${status} ${summarize(data)}`)
      if (FAIL_FAST) process.exit(1)
    }
  }

  // ── 3. Articles ────────────────────────────────────────────────────────────
  const articles = seed.articles || []
  const createdArticles = []
  const failedArticles = []

  if (articles.length > 0) {
    log.banner(`▣ 03 — Articles (${articles.length})`)
    for (const article of articles) {
      const payload = { ...article }
      const { ok, status, data } = await request('POST', '/api/v1/articles', payload)
      if (ok) {
        const returnedId = data?.id || data?.data?.id || article.id
        createdArticles.push({ ...article, backendId: returnedId })
        log.ok(`${article.title.padEnd(50)} → ${returnedId}`)
      } else if (status === 409) {
        log.warn(`${article.title.padEnd(50)} → already exists (skipped)`)
      } else {
        failedArticles.push({ article, status, data })
        log.fail(`${article.title.padEnd(50)} → ${status} ${summarize(data)}`)
        if (FAIL_FAST) process.exit(1)
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  log.banner('▣ Summary')
  console.log(`  Categories created: ${colors.green}${createdCategories.length}${colors.reset} / ${categories.length}`)
  if (failedCategories.length) console.log(`  Categories failed:  ${colors.red}${failedCategories.length}${colors.reset}`)
  console.log(`  Products created:   ${colors.green}${createdProducts.length}${colors.reset} / ${products.length}`)
  if (failedProducts.length) console.log(`  Products failed:    ${colors.red}${failedProducts.length}${colors.reset}`)
  if (articles.length > 0) {
    console.log(`  Articles created:   ${colors.green}${createdArticles.length}${colors.reset} / ${articles.length}`)
    if (failedArticles.length) console.log(`  Articles failed:    ${colors.red}${failedArticles.length}${colors.reset}`)
  }

  if (failedCategories.length + failedProducts.length + failedArticles.length > 0) {
    process.exit(2)
  }
}

main().catch((err) => {
  log.fail(`Unexpected error: ${err.stack || err.message || err}`)
  process.exit(1)
})
