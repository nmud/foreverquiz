export const PLAY_DIMS = [
  'tank', 'support', 'melee', 'risk', 'patience', 'reflex', 'control', 'mobility',
  'multitask', 'complexity', 'planning', 'solo', 'group', 'pvp', 'versatility', 'pet', 'stealth',
] as const

export const FANTASY_DIMS = [
  'holy', 'steel', 'nature', 'beast', 'shadow', 'arcane', 'fel', 'elements',
] as const

export type PlayDim = (typeof PLAY_DIMS)[number]
export type FantasyDim = (typeof FANTASY_DIMS)[number]
export type Dim = PlayDim | FantasyDim
export const ALL_DIMS: Dim[] = [...PLAY_DIMS, ...FANTASY_DIMS]

export type BigFive = 'O' | 'C' | 'E' | 'A' | 'S'
export const BIG_FIVE: BigFive[] = ['O', 'C', 'E', 'A', 'S']

export type ClassId =
  | 'warrior' | 'paladin' | 'priest' | 'mage' | 'warlock'
  | 'rogue' | 'hunter' | 'druid' | 'shaman'

export type GameId = 'interrupt' | 'triage' | 'overcharge' | 'rotation' | 'kite' | 'runes'

export interface InterruptResult { meanRT: number | null; hitRate: number; faRate: number; premature: number }
export interface TriageResult { survivors: number; total: number; avgHp: number; overheal: number; priority: number; heals: number }
export interface OverchargeResult { adjPumps: number; bursts: number; rounds: number; damage: number }
export interface RotationResult { span: number }
export interface KiteResult { inBand: number; melee: number; fire: number }
export interface RunesResult { solved: number; total: number; efficiency: number; firstMoveMs: number | null }

export interface GameResults {
  interrupt?: InterruptResult
  triage?: TriageResult
  overcharge?: OverchargeResult
  rotation?: RotationResult
  kite?: KiteResult
  runes?: RunesResult
}

export interface Answers {
  tipi: (number | null)[]
  choices: Record<string, string[]>
  games: GameResults
  /** Self-reported enjoyment per test, -1 (not for me) … 1 (loved it). */
  enjoy: Partial<Record<GameId, number>>
}

export type Consistency = 'high' | 'mixed' | 'low'

/** Everything the results page needs. Serializable, so it can live in a share link. */
export interface Profile {
  v: 1
  dims: Record<Dim, number>
  big5: Record<BigFive, number> | null
  consistency: Consistency | null
  fantasy: FantasyDim[]
  stats: {
    rt?: number
    fa?: number
    hit?: number
    span?: number
    pumps?: number
    bursts?: number
    kite?: number
    survivors?: [number, number]
    runes?: [number, number]
  }
  enjoy: Partial<Record<GameId, number>>
}

export function emptyAnswers(): Answers {
  return { tipi: Array(10).fill(null), choices: {}, games: {}, enjoy: {} }
}
