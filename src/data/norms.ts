import type { ClassId } from '../engine/types'

/**
 * Mean and SD of each class's raw fit under random responding (20,000 simulated
 * respondents). Centering on these keeps any class from winning by construction.
 * Regenerate with `npm run simulate -- --write` after changing weights.
 */
export const NULL_NORMS: Record<ClassId, [number, number]> = {
  warrior: [0.0256, 0.1095],
  paladin: [0.0359, 0.0999],
  priest: [0.0210, 0.1006],
  mage: [0.0098, 0.0952],
  warlock: [0.0002, 0.0978],
  rogue: [0.0092, 0.0938],
  hunter: [0.0144, 0.1353],
  druid: [0.0209, 0.1002],
  shaman: [0.0399, 0.0946],
}
