import type { Dim, PlayDim } from '../engine/types'

interface DimMeta {
  /** [low pole, high pole] */
  poles: [string, string]
  /** What it says about you when you score high / low. */
  high: string
  low: string
}

export const DIM_META: Record<Dim, DimMeta> = {
  tank: { poles: ['Backline', 'Frontline'], high: 'You want to be the one standing in front', low: 'You would rather stay out of the front line' },
  support: { poles: ['Damage-minded', 'Support-minded'], high: 'Keeping other people alive genuinely appeals to you', low: 'You would rather deal damage than watch health bars' },
  melee: { poles: ['Ranged', 'Melee'], high: 'You like it up close', low: 'You prefer to fight from range' },
  risk: { poles: ['Cautious', 'Risk-taking'], high: 'You push your luck for a bigger payoff', low: 'You play it safe and bank the win' },
  patience: { poles: ['Burst now', 'Payoff later'], high: 'You are happy to wait for a bigger payoff', low: 'You want the damage now, not in thirty seconds' },
  reflex: { poles: ['Deliberate', 'Fast reflexes'], high: 'Your reactions are quick', low: 'You favour deliberate play over twitch reactions' },
  control: { poles: ['Trigger-happy', 'Disciplined'], high: 'You hold fire when you should', low: 'You act fast, sometimes before you should' },
  mobility: { poles: ['Planted', 'Mobile'], high: 'You move well under pressure and enjoyed kiting', low: 'You prefer to plant your feet' },
  multitask: { poles: ['Single focus', 'Multitasker'], high: 'You can juggle several things at once', low: 'You do best focused on one thing at a time' },
  complexity: { poles: ['Lean kit', 'Deep kit'], high: 'You can hold a long rotation in your head', low: 'You like a lean, readable kit' },
  planning: { poles: ['Improviser', 'Planner'], high: 'You plan several moves ahead', low: 'You improvise rather than plan' },
  solo: { poles: ['Needs a group', 'Self-sufficient'], high: 'You enjoy playing on your own', low: 'You do not need to be self-sufficient' },
  group: { poles: ['Lone wolf', 'Group player'], high: 'You light up in a group', low: 'Groups are not your main draw' },
  pvp: { poles: ['PvE', 'PvP'], high: 'You want to beat other players', low: 'You are here for PvE, not PvP' },
  versatility: { poles: ['Specialist', 'Hybrid'], high: 'You like being able to switch roles', low: 'You would rather master one job' },
  pet: { poles: ['Alone', 'Companion'], high: 'You want a companion at your side', low: 'You would rather fight alone' },
  stealth: { poles: ['In the open', 'From the shadows'], high: 'Striking from the shadows appeals to you', low: 'You like fighting in the open' },
  holy: { poles: ['', 'Holy Light'], high: 'Holy Light is your aesthetic', low: 'The Light does not call to you' },
  steel: { poles: ['', 'Steel and Fury'], high: 'Steel and fury is your aesthetic', low: 'Plate and rage are not your look' },
  nature: { poles: ['', 'The Wild'], high: 'The wild calls to you', low: 'Nature magic is not your thing' },
  beast: { poles: ['', 'The Hunt'], high: 'The hunt calls to you', low: 'Beasts and bows are not your look' },
  shadow: { poles: ['', 'Shadows'], high: 'Shadows are your aesthetic', low: 'The shadows do not call to you' },
  arcane: { poles: ['', 'Arcane and Frost'], high: 'Raw arcane power is your aesthetic', low: 'Arcane magic does not call to you' },
  fel: { poles: ['', 'Fel and Demons'], high: 'Fel magic and demons are your aesthetic', low: 'Demons and curses are not your look' },
  elements: { poles: ['', 'The Elements'], high: 'The elements call to you', low: 'Elemental magic is not your thing' },
}

/** Axes shown on the results signature, in reading order. */
export const SIGNATURE: PlayDim[] = [
  'tank', 'support', 'melee', 'group', 'pvp', 'versatility', 'pet', 'stealth',
  'risk', 'patience', 'reflex', 'control', 'mobility', 'multitask', 'complexity', 'planning',
]

/** Plain-language reason for a contribution of `dim` given your score on it. */
export function reason(dim: Dim, score: number) {
  return score >= 0 ? DIM_META[dim].high : DIM_META[dim].low
}

/** "Warlock leans payoff later; you lean burst now." */
export function friction(className: string, dim: Dim, weight: number, score: number) {
  const m = DIM_META[dim]
  if (!m.poles[0]) {
    return weight > 0
      ? `${className} is built around ${lc(m.poles[1])}, which you did not pick.`
      : `${className} has little of the ${lc(m.poles[1])} you picked.`
  }
  const wants = lc(weight > 0 ? m.poles[1] : m.poles[0])
  const you = lc(score > 0 ? m.poles[1] : m.poles[0])
  return `${className} leans ${wants}; you lean ${you}.`
}

/** Lower-case a label unless it is a proper name or acronym (PvP, Holy Light). */
const lc = (s: string) => ((s.match(/[A-Z]/g)?.length ?? 0) > 1 ? s : s.toLowerCase())
