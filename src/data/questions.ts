import type { BigFive, Dim, FantasyDim } from '../engine/types'

/**
 * Ten-Item Personality Inventory (Gosling, Rentfrow & Swann, 2003).
 * "I see myself as…", rated 1 (disagree strongly) to 7 (agree strongly).
 */
export const TIPI: { text: string; trait: BigFive; reverse: boolean }[] = [
  { text: 'Extraverted, enthusiastic', trait: 'E', reverse: false },
  { text: 'Critical, quarrelsome', trait: 'A', reverse: true },
  { text: 'Dependable, self-disciplined', trait: 'C', reverse: false },
  { text: 'Anxious, easily upset', trait: 'S', reverse: true },
  { text: 'Open to new experiences, complex', trait: 'O', reverse: false },
  { text: 'Reserved, quiet', trait: 'E', reverse: true },
  { text: 'Sympathetic, warm', trait: 'A', reverse: false },
  { text: 'Disorganized, careless', trait: 'C', reverse: true },
  { text: 'Calm, emotionally stable', trait: 'S', reverse: false },
  { text: 'Conventional, uncreative', trait: 'O', reverse: true },
]

export const TIPI_SCALE = [
  'Disagree strongly',
  'Disagree moderately',
  'Disagree a little',
  'Neither',
  'Agree a little',
  'Agree moderately',
  'Agree strongly',
]

/** Published TIPI norms (mean, SD), used to turn raw scores into percentiles. */
export const TIPI_NORMS: Record<BigFive, [number, number]> = {
  E: [4.44, 1.45],
  A: [5.23, 1.11],
  C: [5.4, 1.32],
  S: [4.83, 1.42],
  O: [5.38, 1.07],
}

export const BIG_FIVE_LABEL: Record<BigFive, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  S: 'Emotional stability',
}

export interface Option {
  id: string
  label: string
  detail?: string
  effects: Partial<Record<Dim, number>>
}

export interface Question {
  id: string
  prompt: string
  /** Evidence weight for every dimension this question touches. */
  weight: number
  pick?: number
  options: Option[]
}

export const QUESTIONS_A: Question[] = [
  {
    id: 'role',
    prompt: 'A dungeon group needs one more. You take…',
    weight: 1.5,
    options: [
      { id: 'tank', label: 'Tank', detail: 'Stand in front, take the hits, call the pulls', effects: { tank: 1, melee: 0.6, support: -0.3, group: 0.4 } },
      { id: 'heal', label: 'Healer', detail: 'Keep five people alive through the worst of it', effects: { support: 1, tank: -0.4, melee: -0.5, group: 0.4 } },
      { id: 'melee', label: 'Melee damage', detail: 'Up close, behind the boss, relentless', effects: { melee: 1, tank: -0.3, support: -0.5 } },
      { id: 'ranged', label: 'Ranged damage', detail: 'Burn things down from across the room', effects: { melee: -1, tank: -0.5, support: -0.4 } },
      { id: 'flex', label: 'Whatever is missing', detail: 'I can swap to fill the gap', effects: { versatility: 1, group: 0.3 } },
    ],
  },
  {
    id: 'evening',
    prompt: 'A free evening, game open. Where do you go?',
    weight: 1.2,
    options: [
      { id: 'raid', label: 'Raid night with the guild', effects: { group: 1, solo: -0.8, pvp: -0.2 } },
      { id: 'pvp', label: 'Battlegrounds or world PvP', effects: { pvp: 1, group: 0.2, reflex: 0.3 } },
      { id: 'quest', label: 'Solo questing through a new zone', effects: { solo: 1, group: -0.6, pvp: -0.2 } },
      { id: 'farm', label: 'Professions, farming, rare spawns', effects: { solo: 0.6, patience: 0.5, pvp: -0.4 } },
    ],
  },
  {
    id: 'fight',
    prompt: 'In a fight, you most want to be…',
    weight: 1.2,
    options: [
      { id: 'wall', label: 'The one who cannot be killed', effects: { tank: 0.8, risk: -0.7 } },
      { id: 'control', label: 'The one controlling the battlefield', effects: { planning: 0.7, control: 0.6, multitask: 0.4 } },
      { id: 'burst', label: 'The one who deletes a target in seconds', effects: { risk: 0.8, patience: -0.6, reflex: 0.3 } },
      { id: 'savior', label: 'The one who turns a wipe into a win', effects: { support: 0.8, versatility: 0.3 } },
    ],
  },
  {
    id: 'delay',
    prompt: 'Three spells, same mana. Which do you slot?',
    weight: 1.2,
    options: [
      { id: 'now', label: '800 damage, instantly', effects: { patience: -1, risk: 0.2 } },
      { id: 'mid', label: '1,200 damage over 10 seconds', effects: { patience: 0.2 } },
      { id: 'late', label: '2,000 damage over 30 seconds', effects: { patience: 1, planning: 0.3 } },
    ],
  },
]

export const FANTASY_OPTIONS: { id: FantasyDim; label: string; detail: string }[] = [
  { id: 'holy', label: 'Holy Light', detail: 'Radiance, oaths, divine shields' },
  { id: 'steel', label: 'Steel and Fury', detail: 'Plate, rage, a weapon the size of a door' },
  { id: 'nature', label: 'The Wild', detail: 'Shapeshifting, moonfire, the grove' },
  { id: 'beast', label: 'The Hunt', detail: 'Bows, beasts, tracking prey' },
  { id: 'shadow', label: 'Shadows', detail: 'Daggers, poison, the whispering void' },
  { id: 'arcane', label: 'Arcane and Frost', detail: 'Raw magic, portals, ice' },
  { id: 'fel', label: 'Fel and Demons', detail: 'Curses, souls, bound demons' },
  { id: 'elements', label: 'The Elements', detail: 'Storms, totems, earth and fire' },
]

export const QUESTIONS_B: Question[] = [
  {
    id: 'fantasy',
    prompt: 'Which powers call to you?',
    weight: 1.6,
    pick: 2,
    options: FANTASY_OPTIONS.map((f) => ({ id: f.id, label: f.label, detail: f.detail, effects: { [f.id]: 1 } })),
  },
  {
    id: 'pet',
    prompt: 'A permanent companion fights at your side. You…',
    weight: 1.2,
    options: [
      { id: 'love', label: 'Love it', detail: 'I would name it, feed it, collect them', effects: { pet: 1, solo: 0.2 } },
      { id: 'fine', label: 'Fine, if it pulls its weight', effects: { pet: 0.1 } },
      { id: 'no', label: 'Would rather it was just me', effects: { pet: -1 } },
    ],
  },
  {
    id: 'buttons',
    prompt: 'Your ideal action bar is…',
    weight: 1.2,
    options: [
      { id: 'few', label: 'A handful of hard-hitting buttons', detail: 'Focus on the fight, not the keyboard', effects: { complexity: -1, multitask: -0.3 } },
      { id: 'mid', label: 'A tight rotation and a few cooldowns', effects: { complexity: 0.2 } },
      { id: 'full', label: 'Every bar full, let me optimize', detail: 'Procs, timers, the works', effects: { complexity: 1, multitask: 0.4 } },
    ],
  },
  {
    id: 'opener',
    prompt: 'The fight has not started yet. You…',
    weight: 1.2,
    options: [
      { id: 'stealth', label: 'Slip in unseen and pick the moment', effects: { stealth: 1, patience: 0.3, melee: 0.4 } },
      { id: 'charge', label: 'Charge in; it starts when I arrive', effects: { melee: 0.6, risk: 0.5, stealth: -0.6, tank: 0.3 } },
      { id: 'setup', label: 'Set up from range: traps, curses, position', effects: { melee: -0.6, planning: 0.8, stealth: -0.3 } },
      { id: 'buff', label: 'Buff the group and mark the targets', effects: { support: 0.6, group: 0.5, stealth: -0.5 } },
    ],
  },
]
