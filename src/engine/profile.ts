import { FANTASY_OPTIONS, QUESTIONS_A, QUESTIONS_B, TIPI, TIPI_NORMS } from '../data/questions'
import {
  ALL_DIMS, BIG_FIVE, FANTASY_DIMS,
  type Answers, type BigFive, type Consistency, type Dim, type FantasyDim, type GameId, type Profile,
} from './types'

/** Pseudo-observations of "neutral" mixed into every dimension, so thin evidence stays modest. */
const PRIOR_WEIGHT = 0.6

export const clamp = (x: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, x))

/** Standard normal CDF (Abramowitz–Stegun 26.2.17), accurate to ~1e-7. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

export function scoreTipi(tipi: (number | null)[]) {
  if (tipi.some((x) => x == null)) return null
  const items = tipi as number[]
  const pairs: Record<BigFive, number[]> = { O: [], C: [], E: [], A: [], S: [] }
  TIPI.forEach((item, i) => pairs[item.trait].push(item.reverse ? 8 - items[i] : items[i]))

  const z = {} as Record<BigFive, number>
  const pct = {} as Record<BigFive, number>
  let disagreement = 0
  for (const t of BIG_FIVE) {
    const [a, b] = pairs[t]
    const [mean, sd] = TIPI_NORMS[t]
    z[t] = ((a + b) / 2 - mean) / sd
    pct[t] = Math.round(normalCdf(z[t]) * 100)
    disagreement += Math.abs(a - b) / BIG_FIVE.length
  }
  // Each trait is measured twice (once reversed). Pairs far apart, or one answer for
  // every item, means the self-report half deserves less trust.
  const straightLined = items.every((x) => x === items[0])
  const consistency: Consistency = straightLined || disagreement > 2.5 ? 'low' : disagreement > 1.5 ? 'mixed' : 'high'
  return { z, pct, consistency }
}

const enjoyOf = (a: Answers, g: GameId) => a.enjoy[g]

export function buildProfile(a: Answers): Profile {
  const sum = Object.fromEntries(ALL_DIMS.map((d) => [d, 0])) as Record<Dim, number>
  const wsum = Object.fromEntries(ALL_DIMS.map((d) => [d, 0])) as Record<Dim, number>
  const add = (dim: Dim, v: number, w: number) => {
    sum[dim] += clamp(v) * w
    wsum[dim] += w
  }

  // Self-report: personality.
  const tipi = scoreTipi(a.tipi)
  // Low-consistency responders still count, at half weight.
  const trust = tipi?.consistency === 'low' ? 0.5 : 1
  if (tipi) {
    const v = (t: BigFive) => clamp(tipi.z[t] / 2)
    add('group', v('E'), 0.6 * trust)
    add('solo', -v('E'), 0.4 * trust)
    add('tank', v('E'), 0.25 * trust)
    add('support', v('A'), 0.7 * trust)
    add('pvp', -v('A'), 0.5 * trust)
    add('patience', v('C'), 0.5 * trust)
    add('planning', v('C'), 0.4 * trust)
    add('risk', -v('C'), 0.3 * trust)
    add('tank', v('S'), 0.4 * trust)
    add('risk', v('S'), 0.3 * trust)
    add('pvp', v('S'), 0.2 * trust)
    add('versatility', v('O'), 0.6 * trust)
    add('complexity', v('O'), 0.3 * trust)
  }

  // Self-report: playstyle scenarios. A question is evidence for every dimension any of
  // its options touch, so not picking the healer answer is (weak) evidence too.
  for (const q of [...QUESTIONS_A, ...QUESTIONS_B]) {
    const picked = a.choices[q.id]
    if (!picked?.length) continue
    if (q.pick) {
      for (const o of q.options) add(o.id as Dim, picked.includes(o.id) ? 1 : -0.2, q.weight)
      continue
    }
    const chosen = q.options.find((o) => o.id === picked[0])
    if (!chosen) continue
    const touched = new Set(q.options.flatMap((o) => Object.keys(o.effects) as Dim[]))
    for (const dim of touched) add(dim, chosen.effects[dim] ?? 0, q.weight)
  }

  // Behaviour: the six tests. Aptitude says what you are good at; enjoyment says what
  // you would keep doing. Enjoyment is weighted higher, because the question is fun.
  const g = a.games
  if (g.interrupt) {
    const r = g.interrupt
    const speed = r.meanRT == null ? -1 : clamp((600 - r.meanRT) / 200)
    add('reflex', 0.75 * speed + 0.25 * (r.hitRate * 2 - 1), 0.9)
    add('control', 0.8 - 2.6 * r.faRate - 0.08 * r.premature, 0.9)
  }
  if (g.triage) {
    const r = g.triage
    const apt = 0.45 * ((r.survivors / r.total) * 2 - 1) + 0.3 * (r.priority * 2 - 1) + 0.25 * (r.avgHp - 0.5) * 2.5
    add('support', apt, 0.5)
    add('multitask', apt, 0.9)
  }
  if (g.overcharge) add('risk', (g.overcharge.adjPumps - 5.5) / 3, 1.3)
  if (g.rotation) {
    const apt = (g.rotation.span - 5.5) / 2
    add('complexity', apt, 0.6)
    add('multitask', apt, 0.4)
  }
  if (g.kite) add('mobility', (g.kite.inBand - 0.5) / 0.3 - g.kite.fire, 0.7)
  if (g.runes) {
    const r = g.runes
    add('planning', (r.solved / r.total) * r.efficiency * 2 - 1, 0.8)
    if (r.firstMoveMs != null) {
      const deliberation = (r.firstMoveMs - 2500) / 3000
      add('patience', deliberation, 0.35)
      add('planning', deliberation, 0.3)
    }
  }

  const enjoyLinks: [GameId, Dim, number][] = [
    ['interrupt', 'reflex', 0.6], ['interrupt', 'pvp', 0.4],
    ['triage', 'support', 1.1], ['triage', 'group', 0.3],
    ['overcharge', 'risk', 0.4],
    ['rotation', 'complexity', 0.8],
    ['kite', 'mobility', 1], ['kite', 'melee', -0.3],
    ['runes', 'planning', 0.9],
  ]
  for (const [game, dim, w] of enjoyLinks) {
    const e = enjoyOf(a, game)
    if (e != null) add(dim, w < 0 ? -e : e, Math.abs(w))
  }

  const dims = Object.fromEntries(
    ALL_DIMS.map((d) => [d, round2(sum[d] / (wsum[d] + PRIOR_WEIGHT))]),
  ) as Record<Dim, number>

  const fantasy = (a.choices.fantasy ?? []).filter((f): f is FantasyDim =>
    (FANTASY_DIMS as readonly string[]).includes(f),
  )

  const stats: Profile['stats'] = {}
  if (g.interrupt) {
    if (g.interrupt.meanRT != null) stats.rt = Math.round(g.interrupt.meanRT)
    stats.fa = round2(g.interrupt.faRate)
    stats.hit = round2(g.interrupt.hitRate)
  }
  if (g.rotation) stats.span = g.rotation.span
  if (g.overcharge) {
    stats.pumps = Math.round(g.overcharge.adjPumps * 10) / 10
    stats.bursts = g.overcharge.bursts
  }
  if (g.kite) stats.kite = round2(g.kite.inBand)
  if (g.triage) stats.survivors = [g.triage.survivors, g.triage.total]
  if (g.runes) stats.runes = [g.runes.solved, g.runes.total]

  return { v: 1, dims, big5: tipi?.pct ?? null, consistency: tipi?.consistency ?? null, fantasy, stats, enjoy: { ...a.enjoy } }
}

const round2 = (x: number) => Math.round(x * 100) / 100

export const FANTASY_LABEL = Object.fromEntries(FANTASY_OPTIONS.map((f) => [f.id, f.label])) as Record<FantasyDim, string>
