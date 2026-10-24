import type { ClassId } from '../engine/types'

/**
 * Mean and SD of each class's raw fit under random responding (20,000 simulated
 * respondents), each centre nudged so every class wins equally often under random
 * responding. This keeps any class from winning by construction.
 * Regenerate with `npm run simulate -- --write` after changing weights.
 */
/** Scoring mode: play only (default). */
export const NULL_NORMS_PLAY: Record<ClassId, [number, number]> = {
  warrior: [0.0554, 0.1109],
  paladin: [0.0241, 0.0914],
  priest: [0.0029, 0.1162],
  mage: [-0.0045, 0.1013],
  warlock: [0.0199, 0.0999],
  rogue: [0.0515, 0.0993],
  hunter: [0.0373, 0.1527],
  druid: [0.0108, 0.1061],
  shaman: [0.0322, 0.0869],
}

/** Scoring mode: with aesthetic pick. */
export const NULL_NORMS: Record<ClassId, [number, number]> = {
  warrior: [0.0409, 0.1095],
  paladin: [0.0456, 0.0999],
  priest: [0.0090, 0.1006],
  mage: [-0.0057, 0.0952],
  warlock: [0.0003, 0.0927],
  rogue: [0.0192, 0.0938],
  hunter: [0.0090, 0.1320],
  druid: [0.0140, 0.1002],
  shaman: [0.0431, 0.0946],
}
