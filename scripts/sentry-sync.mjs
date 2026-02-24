#!/usr/bin/env node
/**
 * Sentry → GitHub Issues Sync
 * Fetches unresolved Sentry issues and outputs them as JSON.
 * The GitHub Actions workflow creates issues from this output.
 *
 * Usage:
 *   SENTRY_TOKEN=xxx node scripts/sentry-sync.mjs
 *
 * Output: JSON array of new issues to stdout
 */

const SENTRY_TOKEN = process.env.SENTRY_TOKEN
if (!SENTRY_TOKEN) {
  console.error('Missing SENTRY_TOKEN env variable.')
  process.exit(1)
}

const SENTRY_ORG = process.env.SENTRY_ORG || 'spothitch'
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'javascript'
const SENTRY_BASE = 'https://de.sentry.io/api/0'

async function fetchUnresolvedIssues(limit = 25) {
  const url = `${SENTRY_BASE}/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved&limit=${limit}&sort=date`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SENTRY_TOKEN}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`Sentry API error: ${res.status} ${res.statusText}`)
    if (text) console.error(text)
    return []
  }
  return res.json()
}

async function fetchIssueEvents(issueId) {
  const url = `${SENTRY_BASE}/issues/${issueId}/events/?limit=1`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SENTRY_TOKEN}` },
  })
  if (!res.ok) return []
  return res.json()
}

// ---- Main ----
console.error('Fetching Sentry issues...')
const issues = await fetchUnresolvedIssues()

if (issues.length === 0) {
  console.error('No unresolved Sentry issues found.')
  console.log(JSON.stringify([]))
  process.exit(0)
}

console.error(`Found ${issues.length} unresolved issues.`)

const results = []
for (const issue of issues) {
  // Get latest event for stacktrace details
  const events = await fetchIssueEvents(issue.id)
  const latestEvent = events[0] || {}
  const exception = latestEvent.entries?.find(e => e.type === 'exception')
  const stacktrace = exception?.data?.values?.[0]?.stacktrace?.frames || []
  const topFrame = stacktrace[stacktrace.length - 1] || {}

  results.push({
    id: issue.id,
    shortId: issue.shortId,
    title: issue.title,
    culprit: issue.culprit || '',
    level: issue.level || 'error',
    count: issue.count,
    userCount: issue.userCount || 0,
    firstSeen: issue.firstSeen,
    lastSeen: issue.lastSeen,
    file: issue.metadata?.filename || topFrame.filename || '',
    function: issue.metadata?.function || topFrame.function || '',
    url: `https://de.sentry.io/issues/${issue.id}/`,
    stacktrace: stacktrace.slice(-5).map(f => `  ${f.filename || '?'}:${f.lineNo || '?'} in ${f.function || '?'}`).join('\n'),
  })
}

// Output JSON to stdout (GitHub Actions reads this)
console.log(JSON.stringify(results, null, 2))
console.error(`Done. ${results.length} issues exported.`)
