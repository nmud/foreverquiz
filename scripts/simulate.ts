/**
 * Calibration check for the scoring model.
 *   npm run simulate
 * 1. Random respondents: every class should be reachable as the top pick, and none should dominate.
 * 2. Archetype personas: an obvious player should land on the obvious class.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { CLASSES } from '../src/data/classes'
import { NULL_NORMS } from '../src/data/norms'
import { QUESTIONS_A, QUESTIONS_B } from '../src/data/questions'
import { fitClasses, ranked, rawFits } from '../src/engine/fit'
import { buildProfile } from '../src/engine/profile'
import { emptyAnswers, type Answers, type ClassId, type GameId } from '../src/engine/types'

let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
const GAMES: GameId[] = ['interrupt', 'triage', 'overcharge', 'rotation', 'kite', 'runes']

function randomAnswers(): Answers {
  const a = emptyAnswers()
  a.tipi = a.tipi.map(() => 1 + Math.floor(rand() * 7))
  for (const q of [...QUESTIONS_A, ...QUESTIONS_B]) {
    if (q.pick) {
      const ids = q.options.map((o) => o.id).sort(() => rand() - 0.5)
      a.choices[q.id] = ids.slice(0, 1 + Math.floor(rand() * q.pick))
    } else a.choices[q.id] = [pick(q.options).id]
  }
  a.games = {
    interrupt: { meanRT: 380 + rand() * 360, hitRate: 0.6 + rand() * 0.4, faRate: pick([0, 0, 0.25, 0.25, 0.5, 0.75]), premature: Math.floor(rand() * 3) },
    triage: { survivors: 2 + Math.floor(rand() * 4), total: 5, avgHp: 0.35 + rand() * 0.45, overheal: rand() * 0.4, priority: 0.3 + rand() * 0.6, heals: 15 },
    overcharge: { adjPumps: 2 + rand() * 8, bursts: Math.floor(rand() * 4), rounds: 5, damage: 0 },
    rotation: { span: 3 + Math.floor(rand() * 6) },
    kite: { inBand: 0.2 + rand() * 0.7, melee: rand() * 0.3, fire: rand() * 0.15 },
    runes: { solved: Math.floor(rand() * 3), total: 2, efficiency: 0.5 + rand() * 0.5, firstMoveMs: 800 + rand() * 7000 },
  }
  for (const gm of GAMES) a.enjoy[gm] = pick([-1, -0.5, 0, 0.5, 1])
  return a
}

const N = 20000

// Null norms: each class's raw-fit mean and SD under random responding.
if (process.argv.includes('--write')) {
  seed = 11
  const cols: number[][] = CLASSES.map(() => [])
  for (let i = 0; i < N; i++) rawFits(buildProfile(randomAnswers())).forEach((f, j) => cols[j].push(f))
  const lines = CLASSES.map((c, j) => {
    const mu = cols[j].reduce((s, x) => s + x, 0) / N
    const sd = Math.sqrt(cols[j].reduce((s, x) => s + (x - mu) ** 2, 0) / N)
    NULL_NORMS[c.id] = [+mu.toFixed(4), +sd.toFixed(4)]
    return `  ${c.id}: [${mu.toFixed(4)}, ${sd.toFixed(4)}],`
  })
  const file = readFileSync('src/data/norms.ts', 'utf8').replace(
    /export const NULL_NORMS[^]*?\n}\n/,
    `export const NULL_NORMS: Record<ClassId, [number, number]> = {\n${lines.join('\n')}\n}\n`,
  )
  writeFileSync('src/data/norms.ts', file)
  console.log('Wrote src/data/norms.ts')
  seed = 7
}

const wins: Record<string, number> = {}
const pctTop: number[] = []
const pctAll: number[] = []
for (let i = 0; i < N; i++) {
  const fits = fitClasses(buildProfile(randomAnswers()))
  const r = ranked(fits)
  wins[r[0].cls.id] = (wins[r[0].cls.id] ?? 0) + 1
  pctTop.push(r[0].pct)
  fits.forEach((f) => pctAll.push(f.pct))
}
const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
console.log('\nTop-pick share under random responding (ideal ≈ 11.1% each):')
for (const [k, v] of Object.entries(wins).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(8)} ${((v / N) * 100).toFixed(1)}%`)
console.log(`\nTop-class % : p10 ${q(pctTop, 0.1)}  median ${q(pctTop, 0.5)}  p90 ${q(pctTop, 0.9)}`)
console.log(`All classes %: p10 ${q(pctAll, 0.1)}  median ${q(pctAll, 0.5)}  p90 ${q(pctAll, 0.9)}`)

// Personas: [expected class, tipi (1–7 ×10), choices, games-ish, enjoy]
type Persona = { name: string; expect: ClassId[]; tipi: number[]; choices: Record<string, string[]>; enjoy: Partial<Record<GameId, number>>; tweak?: (a: Answers) => void }
const P: Persona[] = [
  { name: 'Holy plate helper', expect: ['paladin'], tipi: [5, 2, 7, 3, 4, 3, 7, 1, 6, 4], choices: { role: ['flex'], evening: ['raid'], fight: ['wall'], delay: ['mid'], fantasy: ['holy', 'steel'], pet: ['no'], buttons: ['few'], opener: ['buff'] }, enjoy: { triage: 1, overcharge: -1 } },
  { name: 'Devoted healer', expect: ['priest'], tipi: [3, 2, 6, 4, 5, 5, 7, 2, 5, 3], choices: { role: ['heal'], evening: ['raid'], fight: ['savior'], delay: ['late'], fantasy: ['holy', 'shadow'], pet: ['no'], buttons: ['mid'], opener: ['buff'] }, enjoy: { triage: 1, interrupt: -0.5 } },
  { name: 'Ganker', expect: ['rogue'], tipi: [4, 6, 4, 2, 5, 4, 2, 4, 6, 3], choices: { role: ['melee'], evening: ['pvp'], fight: ['burst'], delay: ['now'], fantasy: ['shadow'], pet: ['no'], buttons: ['full'], opener: ['stealth'] }, enjoy: { interrupt: 1, rotation: 1, triage: -1 } },
  { name: 'Pet collector, solo', expect: ['hunter'], tipi: [3, 3, 5, 3, 5, 5, 5, 3, 5, 3], choices: { role: ['ranged'], evening: ['quest'], fight: ['control'], delay: ['mid'], fantasy: ['beast', 'nature'], pet: ['love'], buttons: ['mid'], opener: ['setup'] }, enjoy: { kite: 1, triage: -0.5 } },
  { name: 'Patient dotter', expect: ['warlock'], tipi: [2, 5, 6, 3, 6, 6, 3, 2, 5, 2], choices: { role: ['ranged'], evening: ['quest'], fight: ['control'], delay: ['late'], fantasy: ['fel', 'shadow'], pet: ['love'], buttons: ['full'], opener: ['setup'] }, enjoy: { overcharge: 0.5, runes: 1, triage: -1 } },
  { name: 'Glass cannon', expect: ['mage'], tipi: [4, 4, 5, 3, 6, 4, 4, 3, 5, 2], choices: { role: ['ranged'], evening: ['pvp'], fight: ['burst'], delay: ['now'], fantasy: ['arcane'], pet: ['no'], buttons: ['full'], opener: ['setup'] }, enjoy: { kite: 1, interrupt: 1, overcharge: 1, triage: -1 } },
  { name: 'Shape-shifter', expect: ['druid'], tipi: [4, 2, 5, 3, 7, 4, 6, 3, 5, 1], choices: { role: ['flex'], evening: ['quest'], fight: ['savior'], delay: ['mid'], fantasy: ['nature', 'beast'], pet: ['fine'], buttons: ['full'], opener: ['stealth'] }, enjoy: { rotation: 0.5, triage: 0.5 } },
  { name: 'Storm caller', expect: ['shaman'], tipi: [5, 3, 5, 3, 6, 3, 5, 3, 5, 2], choices: { role: ['flex'], evening: ['raid'], fight: ['control'], delay: ['mid'], fantasy: ['elements'], pet: ['fine'], buttons: ['full'], opener: ['buff'] }, enjoy: { rotation: 1, runes: 1, triage: 0.5 } },
  { name: 'Front-line brawler', expect: ['warrior'], tipi: [6, 5, 4, 2, 4, 2, 3, 4, 6, 4], choices: { role: ['tank'], evening: ['raid'], fight: ['wall'], delay: ['now'], fantasy: ['steel'], pet: ['no'], buttons: ['mid'], opener: ['charge'] }, enjoy: { overcharge: 1, interrupt: 0.5, kite: -1, triage: -1 } },
]
console.log('\nPersonas:')
let ok = 0
for (const p of P) {
  const a = emptyAnswers()
  a.tipi = p.tipi
  a.choices = p.choices
  a.enjoy = p.enjoy
  const r = ranked(fitClasses(buildProfile(a)))
  const hit = p.expect.includes(r[0].cls.id)
  ok += hit ? 1 : 0
  console.log(`  ${hit ? 'ok  ' : 'MISS'} ${p.name.padEnd(20)} → ${r.slice(0, 3).map((f) => `${f.cls.name} ${f.pct}% (${f.spec.name})`).join(' · ')}`)
}
console.log(`\n${ok}/${P.length} personas land on the expected class.`)
