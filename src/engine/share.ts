import { ALL_DIMS, BIG_FIVE, FANTASY_DIMS, type FantasyDim, type GameId, type Profile } from './types'

const GAME_IDS: GameId[] = ['interrupt', 'triage', 'overcharge', 'rotation', 'kite', 'runes']

/** Compact, URL-safe encoding of a profile: no server, the link is the result. */
export function encodeProfile(p: Profile): string {
  const payload = {
    v: 1,
    d: ALL_DIMS.map((k) => Math.round(p.dims[k] * 100)),
    b: p.big5 ? BIG_FIVE.map((k) => p.big5![k]) : null,
    c: p.consistency,
    f: p.fantasy,
    s: p.stats,
    e: GAME_IDS.map((g) => (p.enjoy[g] == null ? null : p.enjoy[g]! * 2)),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeProfile(code: string): Profile | null {
  try {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
    if (raw?.v !== 1 || !Array.isArray(raw.d) || raw.d.length !== ALL_DIMS.length) return null
    const num = (x: unknown, lo: number, hi: number) =>
      typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : 0
    const dims = Object.fromEntries(ALL_DIMS.map((k, i) => [k, num(raw.d[i], -100, 100) / 100])) as Profile['dims']
    const big5 = Array.isArray(raw.b) && raw.b.length === 5
      ? (Object.fromEntries(BIG_FIVE.map((k, i) => [k, num(raw.b[i], 0, 100)])) as Profile['big5'])
      : null
    const fantasy = (Array.isArray(raw.f) ? raw.f : []).filter((f: unknown): f is FantasyDim =>
      typeof f === 'string' && (FANTASY_DIMS as readonly string[]).includes(f),
    )
    const enjoy: Profile['enjoy'] = {}
    if (Array.isArray(raw.e)) GAME_IDS.forEach((g, i) => { if (typeof raw.e[i] === 'number') enjoy[g] = num(raw.e[i], -2, 2) / 2 })
    const s = raw.s && typeof raw.s === 'object' ? raw.s : {}
    const stats: Profile['stats'] = {}
    for (const k of ['rt', 'fa', 'hit', 'span', 'pumps', 'bursts', 'kite'] as const) if (typeof s[k] === 'number') stats[k] = num(s[k], 0, 10000)
    for (const k of ['survivors', 'runes'] as const) {
      const pair = s[k]
      if (Array.isArray(pair) && pair.length === 2) stats[k] = [num(pair[0], 0, 99), num(pair[1], 0, 99)]
    }
    const consistency = raw.c === 'high' || raw.c === 'mixed' || raw.c === 'low' ? raw.c : null
    return { v: 1, dims, big5, consistency, fantasy, stats, enjoy }
  } catch {
    return null
  }
}
