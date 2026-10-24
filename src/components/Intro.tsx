import { formatTime } from '../App'
import { Compass } from './Compass'

const BATTERY: [string, string, string][] = [
  ['Personality', 'Big Five, ten items', 'TIPI'],
  ['Playstyle', 'Eight quick choices', 'Survey'],
  ['Reflex', 'Interrupt the right casts', 'Go/No-Go'],
  ['Triage', 'Heal a party under fire', 'Divided attention'],
  ['Risk', 'Overcharge a spell', 'BART'],
  ['Memory', 'Repeat a rotation', 'Span'],
  ['Movement', 'Kite a chasing elite', 'Pursuit'],
  ['Planning', 'Solve a rune puzzle', 'Tower of London'],
]

export function Intro({ totalSeconds, onStart }: { totalSeconds: number; onStart: () => void }) {
  return (
    <section className="intro">
      <div className="intro__copy reveal" style={{ ['--i' as string]: 0 }}>
        <p className="label">World of Warcraft: Forever · nine classes</p>
        <h1 className="display">Find the class you’ll actually main.</h1>
        <p className="lede">
          Ten personality items, eight playstyle choices and six short skill tests. Your answers and your reflexes are
          weighed against what each class asks of a player, and the compass points at the one you’re most likely to enjoy.
        </p>
        <div className="intro__cta">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            Begin
          </button>
          <span className="intro__time mono">about {formatTime(totalSeconds)} · keyboard or touch</span>
        </div>
      </div>
      <figure className="intro__compass reveal" style={{ ['--i' as string]: 1 }} aria-hidden="true">
        <Compass />
      </figure>
      <ol className="battery reveal" style={{ ['--i' as string]: 2 }}>
        {BATTERY.map(([name, what, method], i) => (
          <li key={name}>
            <span className="battery__n mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="battery__name">{name}</span>
            <span className="battery__what">{what}</span>
            <span className="battery__method mono">{method}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
