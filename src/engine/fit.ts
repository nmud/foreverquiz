import { CLASSES, type ClassDef, type Spec } from '../data/classes'
import { NULL_NORMS } from '../data/norms'
import type { ClassId, Dim, Profile } from './types'

export interface ClassFit {
  cls: ClassDef
  /** Weighted agreement between your profile and the class, -1 … 1. */
  fit: number
  /** Estimated likelihood you enjoy maining the class, 0 … 100. */
  pct: number
  spec: Spec
  /** Dimensions pulling you toward the class, strongest first. */
  pulls: [Dim, number][]
  /** The dimension pulling hardest away, if any meaningful one exists. */
  friction: [Dim, number] | null
}

function agreement(weights: Partial<Record<Dim, number>>, dims: Record<Dim, number>) {
  let num = 0
  let den = 0
  for (const [k, w] of Object.entries(weights) as [Dim, number][]) {
    num += w * (dims[k] ?? 0)
    den += Math.abs(w)
  }
  return den ? num / den : 0
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

/**
 * Absolute fit sets the level (does this class suit you at all?); the spread across
 * classes sets the contrast (which one suits you most?). Both feed one logistic.
 */
const ABS_GAIN = 4.2
const REL_GAIN = 0.55

/** Raw agreement with each class, before null-norming. Exposed for calibration. */
export function rawFits(profile: Profile) {
  return CLASSES.map((c) => agreement(c.weights, profile.dims))
}

export function fitClasses(profile: Profile): ClassFit[] {
  const { dims } = profile
  const pooledSd = Object.values(NULL_NORMS).reduce((s, [, sd]) => s + sd, 0) / CLASSES.length
  const raw = rawFits(profile).map((f, i) => {
    const [mu, sd] = NULL_NORMS[CLASSES[i].id]
    return ((f - mu) / sd) * pooledSd
  })
  const mean = raw.reduce((s, x) => s + x, 0) / raw.length
  const sd = Math.sqrt(raw.reduce((s, x) => s + (x - mean) ** 2, 0) / raw.length)

  return CLASSES.map((cls, i) => {
    const fit = raw[i]
    const z = (fit - mean) / Math.max(sd, 0.04)
    const pct = Math.round(100 * sigmoid(ABS_GAIN * fit + REL_GAIN * z))
    const spec = cls.specs
      .map((s) => ({ s, score: agreement(s.weights, dims) }))
      .sort((a, b) => b.score - a.score)[0].s
    const parts = (Object.entries(cls.weights) as [Dim, number][]).map(
      ([k, w]) => [k, w * (dims[k] ?? 0)] as [Dim, number],
    )
    const pulls = parts.filter(([, c]) => c > 0.05).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const worst = parts.sort((a, b) => a[1] - b[1])[0]
    return { cls, fit, pct: Math.min(99, Math.max(1, pct)), spec, pulls, friction: worst && worst[1] < -0.15 ? worst : null }
  })
}

export function ranked(fits: ClassFit[]) {
  return [...fits].sort((a, b) => b.fit - a.fit)
}

export type FitMap = Record<ClassId, ClassFit>
