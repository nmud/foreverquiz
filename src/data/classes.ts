import type { ClassId, Dim } from '../engine/types'

export type Role = 'Tank' | 'Healer' | 'Melee DPS' | 'Ranged DPS'

export interface Spec {
  name: string
  roles: Role[]
  /** How this spec leans relative to the rest of its class. */
  weights: Partial<Record<Dim, number>>
}

export interface ClassDef {
  id: ClassId
  name: string
  blurb: string
  resource: string
  betaTier: string
  /** What the class asks of a player, from -3 (works against it) to 3 (core to it). */
  weights: Partial<Record<Dim, number>>
  specs: Spec[]
}

/** Ring order for the compass: neighbours share an identity (plate, light, arcane, shadow, nature…). */
export const CLASSES: ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    blurb: 'Plate, rage and momentum. Rage builds as you deal and take damage, so the class pays you for staying in the thick of it.',
    resource: 'Rage',
    betaTier: 'A',
    weights: { steel: 3, melee: 2.5, tank: 1.5, risk: 1, pvp: 1, group: 1, reflex: 0.8, patience: -0.8, solo: -0.5, pet: -1, stealth: -1, support: -1, versatility: -0.5 },
    specs: [
      { name: 'Arms', roles: ['Melee DPS'], weights: { pvp: 1.2, planning: 0.8, patience: 0.6, solo: 0.4 } },
      { name: 'Fury', roles: ['Melee DPS'], weights: { risk: 1.5, group: 0.8, reflex: 0.5, patience: -1 } },
      { name: 'Protection', roles: ['Tank'], weights: { tank: 3, group: 1, risk: -0.5 } },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    blurb: 'Holy plate that can tank, heal or fight. Auras and blessings make the whole group better, and the kit forgives mistakes.',
    resource: 'Mana',
    betaTier: 'S',
    weights: { holy: 3, versatility: 1.8, support: 1.4, tank: 1.4, melee: 1.2, group: 1.4, risk: -1.6, patience: 0.8, complexity: -0.8, reflex: -0.4, stealth: -1.5, pet: -1, shadow: -1, fel: -1 },
    specs: [
      { name: 'Holy', roles: ['Healer'], weights: { support: 3, melee: -1 } },
      { name: 'Protection', roles: ['Tank'], weights: { tank: 3, group: 0.5 } },
      { name: 'Retribution', roles: ['Melee DPS'], weights: { melee: 1.5, risk: 1, pvp: 1, solo: 0.5, support: -1.5 } },
    ],
  },
  {
    id: 'priest',
    name: 'Priest',
    blurb: 'Light and shadow in one robe. Discipline and Holy are dedicated healers; Shadowform trades every heal for stronger shadow damage.',
    resource: 'Mana',
    betaTier: 'A',
    weights: { support: 2.6, holy: 1.8, shadow: 1.6, group: 1.6, multitask: 1, patience: 1, melee: -2.5, tank: -1.5, risk: -0.5, pvp: -0.4, stealth: -1, pet: -1, steel: -1 },
    specs: [
      { name: 'Discipline', roles: ['Healer'], weights: { support: 1.5, planning: 1.5, control: 0.5 } },
      { name: 'Holy', roles: ['Healer'], weights: { support: 2.5, group: 1, holy: 1 } },
      { name: 'Shadow', roles: ['Ranged DPS'], weights: { shadow: 2.5, support: -2, solo: 1, patience: 0.5 } },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    blurb: 'Ranged burst, heavy crowd control, blink and portals. Fragile, but rarely standing where the enemy wants it.',
    resource: 'Mana',
    betaTier: 'A',
    weights: { arcane: 3, melee: -3, mobility: 2, reflex: 1.4, risk: 1.2, complexity: 1, planning: 1, control: 0.8, pvp: 1, solo: 0.8, support: -2, tank: -2, pet: -1, steel: -1 },
    specs: [
      { name: 'Arcane', roles: ['Ranged DPS'], weights: { complexity: 1.2, planning: 1, patience: 0.5, arcane: 1 } },
      { name: 'Fire', roles: ['Ranged DPS'], weights: { risk: 2, patience: 0.4, group: 0.5 } },
      { name: 'Frost', roles: ['Ranged DPS'], weights: { mobility: 1.5, control: 1.5, pvp: 1, solo: 0.5, risk: -1 } },
    ],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    blurb: 'Curses, damage over time and bound demons. Drains life from enemies to fuel its own spells, and the payoff comes to those who wait.',
    resource: 'Mana (and your own health)',
    betaTier: 'A',
    weights: { fel: 3, shadow: 1.8, patience: 2.4, pet: 1.8, multitask: 1.4, complexity: 0.6, risk: 1.2, planning: 1, solo: 1.4, mobility: -0.8, melee: -3, support: -1.5, tank: -1, group: -0.4, holy: -1.5, reflex: -0.5 },
    specs: [
      { name: 'Affliction', roles: ['Ranged DPS'], weights: { patience: 2, multitask: 1.5, planning: 0.5 } },
      { name: 'Demonology', roles: ['Ranged DPS'], weights: { pet: 2.5, solo: 0.8, risk: -0.5 } },
      { name: 'Destruction', roles: ['Ranged DPS'], weights: { risk: 1.5, patience: -1.2, reflex: 0.5, group: 0.5 } },
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    blurb: 'Stealth, energy and combo points. Pick the moment, open from the shadows, then finish with poison and burst before they react.',
    resource: 'Energy and combo points',
    betaTier: 'B',
    weights: { stealth: 3, shadow: 1.6, melee: 2.4, reflex: 2, pvp: 2, risk: 1.2, complexity: 1.2, control: 1, planning: 0.8, solo: 1.2, support: -2, tank: -1.5, pet: -1, versatility: -1, holy: -1.5 },
    specs: [
      { name: 'Assassination', roles: ['Melee DPS'], weights: { patience: 1, planning: 1, complexity: 0.5 } },
      { name: 'Combat', roles: ['Melee DPS'], weights: { group: 1, risk: 0.6, complexity: -0.8, solo: 0.5 } },
      { name: 'Subtlety', roles: ['Melee DPS'], weights: { stealth: 2, pvp: 1.5, reflex: 1, complexity: 1 } },
    ],
  },
  {
    id: 'hunter',
    name: 'Hunter',
    blurb: 'Ranged physical damage with a pet at your side. Kiting, traps and tracking make it one of the strongest solo classes in the game.',
    resource: 'Mana',
    betaTier: 'A',
    weights: { beast: 3, pet: 3, melee: -2.4, solo: 2.2, mobility: 2.8, complexity: -0.6, nature: 0.8, planning: 0.6, reflex: 0.5, pvp: 0.4, support: -1, tank: -1, group: -0.5, stealth: -0.5, holy: -1 },
    specs: [
      { name: 'Beast Mastery', roles: ['Ranged DPS'], weights: { pet: 2, solo: 1, complexity: -1 } },
      { name: 'Marksmanship', roles: ['Ranged DPS'], weights: { patience: 1, planning: 1, pet: -1, group: 0.5 } },
      { name: 'Survival', roles: ['Ranged DPS'], weights: { reflex: 1, complexity: 1, mobility: 1, risk: 0.5 } },
    ],
  },
  {
    id: 'druid',
    name: 'Druid',
    blurb: 'A shapeshifter: bear to tank, cat to strike, moonkin to cast, caster form to heal. The widest kit in the game, if you like switching hats.',
    resource: 'Mana, rage or energy by form',
    betaTier: 'B',
    weights: { nature: 3, versatility: 3, complexity: 1, support: 1, solo: 1, beast: 0.8, mobility: 1, multitask: 0.6, tank: 0.5, stealth: 0.4, pet: -1, steel: -1, fel: -1 },
    specs: [
      { name: 'Balance', roles: ['Ranged DPS'], weights: { melee: -2, nature: 1, arcane: 0.5 } },
      { name: 'Feral Combat', roles: ['Tank', 'Melee DPS'], weights: { melee: 2, tank: 1, stealth: 1, complexity: 0.8 } },
      { name: 'Restoration', roles: ['Healer'], weights: { support: 3, multitask: 1 } },
    ],
  },
  {
    id: 'shaman',
    name: 'Shaman',
    blurb: 'Totems, shocks and raw elements. Heal, call lightning or fight with charged weapons, and bring the most group utility while you do it.',
    resource: 'Mana',
    betaTier: 'A',
    weights: { elements: 3, versatility: 2, multitask: 1.4, group: 1.2, planning: 1, reflex: 1, complexity: 1, support: 1, nature: 0.8, tank: -0.5, pet: -0.5, stealth: -1, fel: -1 },
    specs: [
      { name: 'Elemental', roles: ['Ranged DPS'], weights: { melee: -2, risk: 1 } },
      { name: 'Enhancement', roles: ['Melee DPS'], weights: { melee: 2, reflex: 1, risk: 0.5 } },
      { name: 'Restoration', roles: ['Healer'], weights: { support: 3, multitask: 1 } },
    ],
  },
]

export const CLASS_BY_ID = Object.fromEntries(CLASSES.map((c) => [c.id, c])) as Record<ClassId, ClassDef>
