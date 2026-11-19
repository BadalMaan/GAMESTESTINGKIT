import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Crown, Shield, Swords, Zap, RotateCcw, Sparkles } from 'lucide-react'
import { getAttackProfile, resolveExchange } from '../game/engine/combatEngine'
import { chooseCpuPowerIndex } from '../game/engine/aiEngine'
import { playPowerSound } from '../game/engine/audioEngine'

type Props = { onExit: () => void; onWin?: () => void }
type Side = 'blue' | 'red'
type Power = { name: string; type: string; icon: string; strength: number; color: string; note: string }

const blueHeroes = [
  { name: 'NOVA', title: 'THE LIGHTNING STRIKER', image: '/images/fighters/blue-uhd.png', accent: '#79dcff', bonus: 3, passive: 'ENERGY CONTROL · +3 POWER' },
]
const redHeroes = [
  { name: 'EMBER', title: 'THE FIRE CHAMPION', image: '/images/fighters/red-uhd.png', accent: '#ffb19a', bonus: 4, passive: 'FLAME MASTERY · +4 POWER' },
]
const powerPool: Power[] = [
  { name: 'THUNDER SPEAR', type: 'LIGHTNING', icon: 'ϟ', strength: 78, color: '#55c8ff', note: 'A focused bolt that pierces the arena.' },
  { name: 'INFERNO WAVE', type: 'FIRE', icon: '✦', strength: 86, color: '#ff754d', note: 'A sweeping wave of controlled flame.' },
  { name: 'FROST BREAKER', type: 'ICE', icon: '❄', strength: 72, color: '#8deaff', note: 'A freezing strike that slows the rival.' },
  { name: 'VOID CRUSH', type: 'SHADOW', icon: '◈', strength: 92, color: '#b58aff', note: 'A dense shadow blast with heavy impact.' },
  { name: 'SOLAR BURST', type: 'SOLAR', icon: '☼', strength: 88, color: '#ffd36c', note: 'A bright burst of concentrated energy.' },
  { name: 'WIND CUTTER', type: 'WIND', icon: '〰', strength: 66, color: '#a9e6cf', note: 'A fast pressure wave across the ground.' },
  { name: 'CRYSTAL GUARD', type: 'SHIELD', icon: '⬡', strength: 70, color: '#83c9ff', note: 'A defensive wall that absorbs impact.' },
  { name: 'METEOR KICK', type: 'IMPACT', icon: '✹', strength: 82, color: '#ff9b70', note: 'A high-speed physical finisher.' },
  { name: 'PLASMA ORB', type: 'PLASMA', icon: '●', strength: 80, color: '#76a9ff', note: 'A compact energy orb with a sharp hit.' },
  { name: 'PHANTOM DASH', type: 'SPEED', icon: '➤', strength: 75, color: '#d0a8ff', note: 'A sudden dash followed by a clean strike.' },
  { name: 'TIDAL DRAGON', type: 'WATER', icon: '🌊', strength: 91, color: '#53cfff', note: 'A roaring water dragon surges across the arena.' },
  { name: 'OCEAN SPIRAL', type: 'WATER', icon: '💧', strength: 76, color: '#55b9ff', note: 'A twisting water current sweeps the rival away.' },
  { name: 'PHOENIX ROAR', type: 'FIRE', icon: '🔥', strength: 94, color: '#ff754d', note: 'A blazing phoenix wave erupts from the hands.' },
  { name: 'FROST NOVA', type: 'ICE', icon: '❄', strength: 84, color: '#8deaff', note: 'A ring of ice shards bursts outward.' },
  { name: 'GUARDIAN AEGIS', type: 'SHIELD', icon: '🛡️', strength: 89, color: '#83c9ff', note: 'A protective barrier absorbs the incoming force.' },
  { name: 'MEND AURA', type: 'HEAL', icon: '💚', strength: 68, color: '#65dda7', note: 'A green healing pulse restores a little health.' },
]
function shufflePowers(): Power[] {
  const pool = [...powerPool]
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  return pool.slice(0, 5)
}

export default function SuperheroClash({ onExit, onWin }: Props) {
  const [opponentMode, setOpponentMode] = useState<'human' | 'cpu'>('human')
  const [bluePlayerName, setBluePlayerName] = useState('NOVA')
  const [redPlayerName, setRedPlayerName] = useState('EMBER')
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'select' | 'p1' | 'p2' | 'ready' | 'clash' | 'result' | 'finished'>('select')
  const [bluePowers, setBluePowers] = useState<Power[]>([])
  const [redPowers, setRedPowers] = useState<Power[]>([])
  const [bluePick, setBluePick] = useState<number | null>(null)
  const [redPick, setRedPick] = useState<number | null>(null)
  const [blueHealth, setBlueHealth] = useState(100)
  const [redHealth, setRedHealth] = useState(100)
  const [winner, setWinner] = useState<Side | null>(null)
  const [clashId, setClashId] = useState(0)
  const [impactSide, setImpactSide] = useState<Side | null>(null)
  const [dominantSide, setDominantSide] = useState<Side | null>(null)
  const [clashBeat, setClashBeat] = useState<'charge' | 'windup' | 'release' | 'collision' | 'breakthrough' | 'impact' | 'recovery'>('charge')
  const [impactDamage, setImpactDamage] = useState(0)
  const [comboLabel, setComboLabel] = useState('')
  const [comboHits, setComboHits] = useState(0)
  const timersRef = useRef<number[]>([])
  const clearCombatTimers = () => { timersRef.current.forEach(timer => window.clearTimeout(timer)); timersRef.current = [] }
  useEffect(() => () => clearCombatTimers(), [])
  const [blueReaction, setBlueReaction] = useState<'hurt' | 'stumble' | 'fall' | 'guard'>('guard')
  const [redReaction, setRedReaction] = useState<'hurt' | 'stumble' | 'fall' | 'guard'>('guard')

  const blue = blueHeroes[0], red = redHeroes[0]
  const blueDisplayName = bluePlayerName.trim() || blue.name
  const redDisplayName = redPlayerName.trim() || (opponentMode === 'cpu' ? 'ARENA CPU' : red.name)
  const bluePower = bluePick === null ? null : bluePowers[bluePick]
  const redPower = redPick === null ? null : redPowers[redPick]
  const poseForPower = (power: Power | null) => {
    if (!power) return 'punch'
    if (power.type === 'SHIELD' || power.type === 'HEAL') return 'guard'
    if (['IMPACT', 'SPEED'].includes(power.type)) return 'kick'
    return 'cast'
  }
  const fighterImage = (side: Side, power: Power | null, reaction: string, isClashing: boolean) => {
    // High-resolution hero artwork is used for the persistent fighter layer.
    // The live combat canvas supplies attack timing, lunge, hit reactions and VFX.
    // This avoids enlarging the old 300px pose thumbnails in the full arena.
    if (reaction === 'fall' || reaction === 'hurt' || reaction === 'stumble') {
      return `/images/fighters/${side}-uhd.png`
    }
    if (isClashing && power && !['SHIELD', 'HEAL'].includes(power.type)) {
      const action = ['IMPACT', 'SPEED'].includes(power.type) ? 'kick' : 'punch'
      return `/images/fighters/${side}-${action}.png`
    }
    return `/images/fighters/${side}-uhd.png`
  }
  const begin = () => {
    clearCombatTimers(); setBlueHealth(100); setRedHealth(100); setRound(1); setWinner(null); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge')
    setBluePowers(shufflePowers()); setRedPowers(shufflePowers()); setBluePick(null); setRedPick(null); setImpactSide(null); setBlueReaction('guard'); setRedReaction('guard'); setPhase('p1')
  }
  const choose = (side: Side, index: number) => {
    if (side === 'blue' && phase === 'p1') {
      setBluePick(index)
      if (opponentMode === 'cpu') {
        const cpuIndex = chooseCpuPowerIndex(redPowers, bluePowers[index])
        setRedPick(cpuIndex); setPhase('ready')
      } else setPhase('p2')
    }
    if (side === 'red' && phase === 'p2') { setRedPick(index); setPhase('ready') }
  }
  const resolve = () => {
    if (!bluePower || !redPower || phase !== 'ready') return
    clearCombatTimers()
    setPhase('clash')
    setClashId(v => v + 1)
    setClashBeat('charge')

    // The original power-strength contest is preserved, but each move now
    // resolves through its own attack profile, contact box, hit count and reaction.
    const blueCombatPower = { ...bluePower, strength: bluePower.strength + blue.bonus }
    const redCombatPower = { ...redPower, strength: redPower.strength + red.bonus }
    const exchange = resolveExchange(blueCombatPower, redCombatPower, blueHealth, redHealth)
    const attackPower = exchange.winner === 'blue' ? blueCombatPower : redCombatPower
    playPowerSound(attackPower.type, attackPower.strength)
    const winningSide: Side = exchange.winner
    const blueTakesHit = exchange.victim === 'blue' && exchange.damage > 0
    const redTakesHit = exchange.victim === 'red' && exchange.damage > 0
    const actualDamage = exchange.damage
    const nextBlue = exchange.blueHealth
    const nextRed = exchange.redHealth
    setComboLabel(exchange.comboLabel)
    setComboHits(exchange.hitCount)
    setDominantSide(winningSide)
    setImpactSide(exchange.victim)
    setImpactDamage(actualDamage)
    setBlueReaction('guard')
    setRedReaction('guard')

    // Preserve a consistent 3.6s cinematic exchange while each move keeps
    // its own startup / active / recovery timing proportions.
    const timing = exchange.profile
    const timingTotal = timing.startupMs + timing.activeMs + timing.recoveryMs
    const timingScale = 3600 / timingTotal
    const windupAt = Math.round(timing.startupMs * timingScale * .55)
    const releaseAt = Math.round(timing.startupMs * timingScale)
    const collisionAt = Math.round((timing.startupMs + timing.activeMs * .48) * timingScale)
    const breakthroughAt = Math.round((timing.startupMs + timing.activeMs * .76) * timingScale)
    const impactAt = Math.round((timing.startupMs + timing.activeMs) * timingScale)
    const recoveryAt = Math.round((timing.startupMs + timing.activeMs + timing.recoveryMs * .5) * timingScale)
    const victimReaction = timing.reaction === 'freeze' || timing.reaction === 'guard-break' ? 'stumble' : 'hurt'
    timersRef.current.push(window.setTimeout(() => setClashBeat('windup'), windupAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('release'), releaseAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('collision'), collisionAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('breakthrough'), breakthroughAt))
    timersRef.current.push(window.setTimeout(() => {
      setClashBeat('impact')
      setBlueHealth(nextBlue)
      setRedHealth(nextRed)
      setBlueReaction(blueTakesHit ? (nextBlue <= 0 ? 'fall' : victimReaction) : 'guard')
      setRedReaction(redTakesHit ? (nextRed <= 0 ? 'fall' : victimReaction) : 'guard')
    }, impactAt))
    timersRef.current.push(window.setTimeout(() => setClashBeat('recovery'), recoveryAt))
    timersRef.current.push(window.setTimeout(() => {
      if (nextBlue <= 0 || nextRed <= 0) {
        const winSide: Side = nextBlue > nextRed ? 'blue' : 'red'
        setWinner(winSide)
        setPhase('finished')
        onWin?.()
      } else setPhase('result')
    }, 3600))
  }
  const nextRound = () => {
    clearCombatTimers(); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge')
    setRound(v => v + 1); setBluePowers(shufflePowers()); setRedPowers(shufflePowers()); setBluePick(null); setRedPick(null); setImpactSide(null); setBlueReaction('guard'); setRedReaction('guard'); setPhase('p1')
  }
  const reset = () => { clearCombatTimers(); setPhase('select'); setWinner(null); setImpactSide(null); setDominantSide(null); setImpactDamage(0); setComboLabel(''); setComboHits(0); setClashBeat('charge'); setBlueHealth(100); setRedHealth(100); setBluePick(null); setRedPick(null) }

  return <main className="gsh-screen gsh-real-game gsh-clean-clash" aria-label="Global Super Hero fighting game">
    <header className="gsh-back-row"><button onClick={onExit}><ArrowLeft size={17}/> EXIT ARENA</button><div className="gsh-brand"><Crown size={18}/> GLOBAL SUPER HERO</div><span className="gsh-round-tag">2 PLAYER · POWER CLASH</span></header>

    {phase === 'select' && <section className="gc-select">
      <div className="gc-kicker">THE ARENA IS READY</div><h1>CHOOSE YOUR CHAMPIONS</h1><p>Two heroes enter. Every round brings five new powers. Choose wisely.</p>
      <div className="gc-select-grid">
        <article className="gc-hero-card blue"><div className="gc-player-label">PLAYER 1</div><img src={blue.image} alt="Blue hero"/><h2>{blue.name}</h2><span>{blue.title} · {blue.passive}</span><label className="gc-name-field">PLAYER 1 NAME<input maxLength={18} value={bluePlayerName} onChange={e => setBluePlayerName(e.target.value)} placeholder="Enter player 1 name"/></label></article>
        <div className="gc-vs">VS</div>
        <article className="gc-hero-card red"><div className="gc-player-label">PLAYER 2</div><img src={red.image} alt="Red hero"/><h2>{red.name}</h2><span>{red.title} · {red.passive}</span><label className="gc-name-field">PLAYER 2 NAME<input maxLength={18} value={redPlayerName} onChange={e => setRedPlayerName(e.target.value)} placeholder="Enter player 2 name"/></label><div className="gc-opponent-mode"><button className={opponentMode === 'human' ? 'active' : ''} onClick={() => setOpponentMode('human')}>2 PLAYERS</button><button className={opponentMode === 'cpu' ? 'active' : ''} onClick={() => setOpponentMode('cpu')}>VS CPU</button></div></article>
      </div>
      <button className="gc-primary" onClick={begin}>ENTER THE ARENA <Swords size={19}/></button>
    </section>}

    {phase !== 'select' && <section className="gc-game">
      <div className="gc-top-hud">
        <div className="gc-hud-side blue"><div><small>PLAYER 1</small><strong>{blueDisplayName}</strong></div><div className="gc-health"><i style={{ width: `${blueHealth}%` }}/></div><b>{blueHealth}%</b></div>
        <div className="gc-round"><small>ROUND</small><strong>{round.toString().padStart(2, '0')}</strong></div>
        <div className="gc-hud-side red"><div><small>PLAYER 2</small><strong>{redDisplayName}</strong></div><div className="gc-health"><i style={{ width: `${redHealth}%` }}/></div><b>{redHealth}%</b></div>
      </div>

      <div className={`gc-stage ${phase === 'clash' ? `is-clashing beat-${clashBeat} dominant-${dominantSide}` : ''} ${phase === 'result' ? `impact-${impactSide}` : ''} ${phase === 'finished' ? `is-finished winner-${winner}` : ''}`} key={clashId}>
        <div className="gc-arena-backdrop"><img src="/images/arena-background.png" alt="Grand championship arena"/><div className="gc-arena-vignette"/><div className="gc-floor-ring ring-one"/><div className="gc-floor-ring ring-two"/></div>
        {phase === 'clash' && <>
          {impactSide && <div className={`gc-hit-spark gc-hit-${impactSide}`} aria-hidden="true"/>}
          <div className={`gc-breakthrough ${dominantSide || 'blue'}`} aria-hidden="true" />
          <div className={`gc-target-burst ${impactSide || 'red'}`} aria-hidden="true" />
          <div className="gc-impact"><i/><b>{clashBeat === 'impact' ? 'DIRECT HIT' : 'CLASH'}</b><i/></div>
        </>}
        <div className={`gc-fighter blue ${phase === 'clash' ? `blue-attack pose-${poseForPower(bluePower)} ${clashBeat === 'impact' && impactSide === 'blue' ? 'blue-hurt' : ''} ${clashBeat === 'impact' && impactSide === 'blue' && blueHealth - impactDamage <= 0 ? 'blue-fall' : ''}` : phase === 'result' ? `blue-${blueReaction}` : phase === 'finished' ? (winner === 'blue' ? 'gc-champion-fighter' : 'blue-fall gc-defeated-fighter') : ''}`}>
          <img className="gc-base-pose" src={fighterImage('blue', bluePower, blueReaction, phase === 'clash')} alt={`${blueDisplayName} fighter action`} />
        </div>
        <div className={`gc-fighter red ${phase === 'clash' ? `red-attack pose-${poseForPower(redPower)} ${clashBeat === 'impact' && impactSide === 'red' ? 'red-hurt' : ''} ${clashBeat === 'impact' && impactSide === 'red' && redHealth - impactDamage <= 0 ? 'red-fall' : ''}` : phase === 'result' ? `red-${redReaction}` : phase === 'finished' ? (winner === 'red' ? 'gc-champion-fighter' : 'red-fall gc-defeated-fighter') : ''}`}>
          <img className="gc-base-pose" src={fighterImage('red', redPower, redReaction, phase === 'clash')} alt={`${redDisplayName} fighter action`} />
        </div>
        {phase === 'clash' && bluePower && redPower && dominantSide && impactSide && <LivePowerCanvas
          bluePower={bluePower} redPower={redPower} winningSide={dominantSide} impactSide={impactSide} beat={clashBeat} blueAccent={blue.accent} redAccent={red.accent}
        />}
        {phase === 'clash' && clashBeat === 'impact' && impactDamage > 0 && <div className={`gc-damage-number ${impactSide || 'red'}`}>−{impactDamage}<small>{comboLabel}{comboHits > 1 ? ` · ${comboHits} HITS` : ''}</small></div>}
        {phase === 'result' && <div className="gc-result-banner"><strong>ROUND COMPLETE</strong><span>CHOOSE AGAIN</span></div>}
      {phase === 'finished' && <div className={`gc-win-celebration gc-premium-victory ${winner || 'blue'}`} aria-live="assertive">
        <div className="gc-victory-dim"/>
        <div className="gc-victory-spotlight"/>
        <div className="gc-victory-rays"/>
        <div className="gc-victory-halo halo-outer"/><div className="gc-victory-halo halo-inner"/>
        <div className="gc-victory-orbit orbit-one"/><div className="gc-victory-orbit orbit-two"/>
        <div className="gc-victory-confetti confetti-a"/><div className="gc-victory-confetti confetti-b"/><div className="gc-victory-confetti confetti-c"/><div className="gc-victory-confetti confetti-d"/><div className="gc-victory-confetti confetti-e"/><div className="gc-victory-confetti confetti-f"/>
        <div className="gc-firework fw-one"/><div className="gc-firework fw-two"/><div className="gc-firework fw-three"/><div className="gc-firework fw-four"/><div className="gc-firework fw-five"/>
        <div className="gc-victory-content">
          <div className="gc-victory-overline"><i/> THE FINAL BLOW <i/></div>
          <div className="gc-victory-crest"><div className="gc-crest-ring"><Crown size={42} strokeWidth={1.7}/></div><span>★</span></div>
          <div className="gc-win-copy"><span>✦ VICTORY ✦</span><strong>{winner === 'blue' ? blueDisplayName : redDisplayName}</strong><b>ARENA CHAMPION</b></div>
          <div className="gc-victory-subtitle">THE ARENA HAS A NEW LEGEND</div>
          <div className="gc-victory-sparks"><i/><i/><i/><i/><i/><i/><i/></div>
        </div>
      </div>}
      </div>

      <div className="gc-turn-status">
        {phase === 'p1' && <><span className="gc-dot blue-dot"/> PLAYER 1 — CHOOSE A NUMBER</>}
        {phase === 'p2' && <><span className="gc-dot red-dot"/> PLAYER 2 — YOUR TURN. PLAYER 1'S PICK IS HIDDEN.</>}
        {phase === 'ready' && <><Sparkles size={16}/> BOTH POWERS LOCKED — READY TO REVEAL?</>}
        {phase === 'clash' && <><Zap size={16}/> POWER CHARGING — THE STRIKE IS COMING</>}
        {phase === 'result' && <><Shield size={16}/> ROUND COMPLETE — CHOOSE AGAIN</>}
        {phase === 'finished' && <><Crown size={16}/> BATTLE FINISHED</>}
      </div>

      {(phase === 'p1' || phase === 'p2' || phase === 'ready') && <div className="gc-pick-panels">
        <PowerPicker side="blue" powers={bluePowers} selected={phase === 'ready' ? bluePick : null} active={phase === 'p1'} locked={bluePick !== null} onChoose={i => choose('blue', i)} />
        <div className="gc-middle-action">
          <div className="gc-lock-state">{bluePick === null ? 'P1 WAITING' : 'P1 LOCKED'}<span>{redPick === null ? 'P2 WAITING' : 'P2 LOCKED'}</span></div>
          {phase === 'ready' && <button className="gc-primary gc-reveal" onClick={resolve}>ATTACK! <Swords size={18}/></button>}
          {phase !== 'ready' && <div className="gc-vs-mini">VS</div>}
        </div>
        <PowerPicker side="red" powers={redPowers} selected={phase === 'ready' ? redPick : null} active={phase === 'p2'} locked={redPick !== null} onChoose={i => choose('red', i)} />
      </div>}
      {(phase === 'clash' || phase === 'result' || phase === 'finished') && <div className="gc-reveal-row">
        <div className="gc-revealed blue"><small>{blueDisplayName}'S POWER</small><strong><em>{bluePower?.icon}</em>{bluePower?.name}</strong><span>{bluePower?.note}</span></div>
        <div className="gc-revealed red"><small>{redDisplayName}'S POWER</small><strong><em>{redPower?.icon}</em>{redPower?.name}</strong><span>{redPower?.note}</span></div>
      </div>}
      {phase === 'result' && <button className="gc-primary gc-next" onClick={nextRound}>NEXT ROUND <Zap size={18}/></button>}
      {phase === 'finished' && <div className="gc-finish-actions"><button className="gc-primary" onClick={reset}><RotateCcw size={17}/> NEXT FIGHT · EDIT PLAYERS</button></div>}
      <div className="gc-footnote">POWER SLOTS SHUFFLE EVERY ROUND <span>·</span> NO KEYBOARD REQUIRED <span>·</span> FIRST TO ZERO HEALTH LOSES</div>
    </section>}
  </main>
}

function PowerPicker({ side, powers, selected, active, locked, onChoose }: { side: Side; powers: Power[]; selected: number | null; active: boolean; locked: boolean; onChoose: (i: number) => void }) {
  const selectedProfile = selected !== null && powers[selected] ? getAttackProfile(powers[selected]) : null
  return <div className={`gc-picker ${side} ${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}>
    <div className="gc-picker-head"><strong>{side === 'blue' ? 'PLAYER 1' : 'PLAYER 2'}</strong><span>{locked ? 'POWER LOCKED' : active ? 'SELECT ONE POWER' : 'WAITING'}</span></div>
    <div className="gc-power-grid gc-number-grid">{powers.map((power, i) => <button key={`${power.name}-${i}`} aria-label={`Choose option ${i + 1}`} title={`Option ${i + 1}`} disabled={!active || locked} className={`gc-number-option ${selected === i ? 'chosen' : ''}`} onClick={() => onChoose(i)}><span className="gc-option-number">{i + 1}</span></button>)}</div>
    {selected !== null && powers[selected] && <div className={`gc-selected-power power-${powers[selected].type.toLowerCase()}`} style={{ '--selected-power': powers[selected].color } as CSSProperties}>
      <div className="gc-selected-power-heading"><span className="gc-selected-power-icon">{powers[selected].icon}</span><div className="gc-selected-power-copy"><small>OPTION {selected + 1} · {powers[selected].type} POWER</small><strong>{powers[selected].name}</strong></div><span className="gc-selected-check">✓</span></div>
      <p>{powers[selected].note}</p>
      <div className="gc-attack-form"><span className="gc-attack-form-label">ATTACK FORM</span><strong>{attackFormFor(powers[selected])}</strong><span className="gc-attack-form-hint">{attackFormHint(powers[selected])}</span></div>
      {selectedProfile && <div className="gc-move-stats"><span><b>{selectedProfile.startupMs}ms</b><small>STARTUP</small></span><span><b>{selectedProfile.activeMs}ms</b><small>ACTIVE</small></span><span><b>{selectedProfile.recoveryMs}ms</b><small>RECOVERY</small></span><span><b>{selectedProfile.hitCount}×</b><small>HITS</small></span></div>}
      {locked && <div className="gc-choice-confirm">POWER LOCKED · READY FOR THE CLASH</div>}
    </div>}
  </div>
}


function attackFormFor(power: Power): string {
  if (power.type === 'LIGHTNING') return 'LIGHTNING CAST · SPEAR RELEASE'
  if (power.type === 'FIRE') return 'FLAME CAST · INFERNO SURGE'
  if (power.type === 'ICE') return 'ICE CAST · CRYSTAL BURST'
  if (power.type === 'SHADOW') return 'VOID CAST · SHADOW CRUSH'
  if (power.type === 'SOLAR') return 'SOLAR CAST · RADIANT BLAST'
  if (power.type === 'WIND') return 'WIND CAST · PRESSURE WAVE'
  if (power.type === 'SHIELD') return 'DEFENSIVE STANCE · AEGIS FORM'
  if (power.type === 'IMPACT') return 'POWER STRIKE · METEOR FORM'
  if (power.type === 'PLASMA') return 'ENERGY CAST · PLASMA ORB'
  if (power.type === 'SPEED') return 'PHANTOM DASH · QUICK STRIKE'
  if (power.type === 'WATER') return 'WATER CAST · TIDAL SURGE'
  if (power.type === 'HEAL') return 'SUPPORT FORM · HEALING PULSE'
  return `${power.type} FORM · SPECIAL RELEASE`
}
function attackFormHint(power: Power): string {
  if (['SHIELD', 'HEAL'].includes(power.type)) return 'A defensive/support action with a dedicated visual effect'
  if (['IMPACT', 'SPEED'].includes(power.type)) return 'A close-range physical attack with a fast impact finish'
  return 'A signature energy attack with a distinct elemental release'
}

type LivePowerCanvasProps = {
  bluePower: Power
  redPower: Power
  winningSide: Side
  impactSide: Side
  beat: 'charge' | 'windup' | 'release' | 'collision' | 'breakthrough' | 'impact' | 'recovery'
  blueAccent: string
  redAccent: string
}

type LiveParticle = { x:number; y:number; vx:number; vy:number; life:number; max:number; size:number; hue:number; alpha:number }

function LivePowerCanvas({ bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent }: LivePowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const valuesRef = useRef({ bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent })
  valuesRef.current = { bluePower, redPower, winningSide, impactSide, beat, blueAccent, redAccent }

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = canvas?.parentElement
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !stage || !ctx) return
    let raf = 0
    let width = 0
    let height = 0
    let start = performance.now()
    let last = start
    const particles: LiveParticle[] = []
    // Real illustrated fighter poses and authored elemental artwork. These are
    // decoded once per clash and reused; the render loop never creates Images.
    const fighterSprites: Record<string, HTMLImageElement> = {}
    const fighterFiles = [
      'blue-uhd','blue-punch','blue-kick',
      'red-uhd','red-punch','red-kick',
      'blue-water-cast','blue-lightning-cast','blue-shield-cast',
      'red-fire-cast','red-solar-cast','red-shield-cast',
    ]
    for (const key of fighterFiles) { const image = new Image(); image.src = `/images/fighters/${key}.png`; fighterSprites[key] = image }
    const powerSprites: Record<string, HTMLImageElement> = {}
    const powerFiles = ['solar','shield','phoenix','frost-nova','ice','water-vortex','plasma','guardian-aegis','water-dragon','impact','speed','lightning','wind','fire','shadow','mend-aura']
    for (const key of powerFiles) { const image = new Image(); image.src = `/images/power-effects/${key}.png`; powerSprites[key] = image }
    // All 16 transparent VFX textures are preloaded at arena entry and reused by this renderer.
    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const observer = new ResizeObserver(resize)
    observer.observe(stage)

    const rand = (min:number,max:number) => min + Math.random() * (max-min)
    const hexRgb = (hex:string) => {
      const raw = hex.replace('#','')
      const full = raw.length === 3 ? raw.split('').map(v=>v+v).join('') : raw
      const n = parseInt(full,16)
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }
    }
    const rgba = (hex:string,a:number) => {
      const c=hexRgb(hex)
      return `rgba(${c.r},${c.g},${c.b},${Math.max(0,Math.min(1,a))})`
    }
    const addBurst = (x:number,y:number,color:string,count:number,force:number) => {
      const hue = (() => { const c=hexRgb(color); return c.r>c.g && c.r>c.b ? 20 : c.b>c.r ? 205 : 145 })()
      for(let i=0;i<count && particles.length<260;i++){
        const angle=rand(0,Math.PI*2), speed=rand(force*.25,force)
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:rand(.35,.9),max:.9,size:rand(1.2,4.5),hue,alpha:rand(.5,1)})
      }
    }
    const drawOrb = (x:number,y:number,r:number,color:string,power:Power,t:number,alpha=1) => {
      if(r<=0) return
      ctx.save()
      ctx.globalAlpha=alpha
      const glow=ctx.createRadialGradient(x-r*.2,y-r*.2,r*.04,x,y,r*1.8)
      glow.addColorStop(0,rgba(color,.92))
      glow.addColorStop(.12,rgba(color,.98))
      glow.addColorStop(.42,rgba(color,.56))
      glow.addColorStop(1,rgba(color,0))
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*1.8,0,Math.PI*2);ctx.fill()
      ctx.shadowColor=color;ctx.shadowBlur=r*1.4
      ctx.fillStyle=rgba(color,.94);ctx.beginPath();ctx.arc(x,y,r*.62,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0
      ctx.fillStyle=rgba(color,.72);ctx.beginPath();ctx.arc(x-r*.15,y-r*.17,r*.16,0,Math.PI*2);ctx.fill()
      ctx.strokeStyle=rgba(color,.9);ctx.lineWidth=Math.max(1,r*.07)
      ctx.beginPath();ctx.ellipse(x,y,r*1.1,r*.55,t*.9,0,Math.PI*2);ctx.stroke()
      // Individual live geometry gives each power family its own silhouette.
      if(power.type==='LIGHTNING'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.12);ctx.beginPath()
        ctx.moveTo(x-r*.9,y);ctx.lineTo(x-r*.35,y-r*.55);ctx.lineTo(x-r*.05,y+r*.12);ctx.lineTo(x+r*.25,y-r*.45);ctx.lineTo(x+r*.8,y);ctx.stroke()
      } else if(power.type==='FIRE'){
        for(let k=0;k<3;k++){const a=t*2+k*2.1;ctx.fillStyle=rgba(k===1?'#fff1b0':color,.7);ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.35,y+Math.sin(a)*r*.35,r*.18,r*.58,a,0,Math.PI*2);ctx.fill()}
      } else if(power.type==='ICE'){
        ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(1,r*.08)
        for(let k=0;k<6;k++){const a=k*Math.PI/3+t*.25;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.95,y+Math.sin(a)*r*.95);ctx.stroke()}
      } else if(power.type==='WATER'){
        ctx.strokeStyle=rgba('#d8f7ff',.9);ctx.lineWidth=Math.max(2,r*.12);ctx.beginPath();ctx.ellipse(x,y,r*.95,r*.42,t*1.7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(x,y,r*.62,r*.26,-t*1.5,0,Math.PI*2);ctx.stroke()
      } else if(power.type==='SHADOW'){
        ctx.strokeStyle=rgba('#d7c0ff',.85);ctx.lineWidth=Math.max(2,r*.1);ctx.beginPath();ctx.arc(x,y,r*.8,t,t+Math.PI*1.5);ctx.stroke()
      } else if(power.type==='SOLAR'){
        ctx.strokeStyle='rgba(255,255,220,.95)';ctx.lineWidth=Math.max(1,r*.07)
        for(let k=0;k<12;k++){const a=k*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8);ctx.lineTo(x+Math.cos(a)*r*1.25,y+Math.sin(a)*r*1.25);ctx.stroke()}
      } else if(power.type==='PLASMA'){
        ctx.strokeStyle=rgba('#ffffff',.8);ctx.lineWidth=Math.max(1,r*.06);ctx.beginPath();ctx.arc(x,y,r*.72,t,t+Math.PI*1.6);ctx.stroke()
      } else if(power.type==='SHIELD'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.09);ctx.beginPath()
        ctx.moveTo(x,y-r*.95);ctx.lineTo(x+r*.78,y-r*.55);ctx.lineTo(x+r*.66,y+r*.38);ctx.lineTo(x,y+r*.95);ctx.lineTo(x-r*.66,y+r*.38);ctx.lineTo(x-r*.78,y-r*.55);ctx.closePath();ctx.stroke()
        ctx.fillStyle=rgba(power.color,.18);ctx.fill()
      } else if(power.type==='HEAL'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(3,r*.18);ctx.lineCap='round'
        ctx.beginPath();ctx.moveTo(x-r*.45,y);ctx.lineTo(x+r*.45,y);ctx.moveTo(x,y-r*.45);ctx.lineTo(x,y+r*.45);ctx.stroke()
        ctx.strokeStyle=rgba(power.color,.8);ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(x,y,r*1.15,-t,t+Math.PI*1.7);ctx.stroke()
      } else if(power.type==='WIND'){
        ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(2,r*.1)
        for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x-r*.25,y+(k-1)*r*.28,r*.75,-.8+t*.25,.8+t*.25);ctx.stroke()}
      } else if(power.type==='IMPACT' || power.type==='SPEED'){
        ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,r*.1)
        for(let k=0;k<8;k++){const a=k*Math.PI/4+t;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25);ctx.lineTo(x+Math.cos(a)*r*1.15,y+Math.sin(a)*r*1.15);ctx.stroke()}
      } else {
        ctx.strokeStyle=rgba('#ffffff',.78);ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(x,y,r*.8,-t,t+Math.PI);ctx.stroke()
      }
      ctx.restore()
    }
    const drawTrail = (x1:number,y1:number,x2:number,y2:number,color:string,power:Power,alpha:number) => {
      const dx=x2-x1,dy=y2-y1
      const grad=ctx.createLinearGradient(x1,y1,x2,y2)
      grad.addColorStop(0,rgba(color,0))
      grad.addColorStop(.45,rgba(color,.42*alpha))
      grad.addColorStop(1,rgba(color,.96*alpha))
      ctx.save()
      ctx.lineCap='round'
      ctx.strokeStyle=grad
      ctx.lineWidth=power.type==='WIND'?5:Math.max(4,width*.006)
      ctx.shadowColor=color;ctx.shadowBlur=22
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(x1+dx*.48,y1+dy*.48-8,x2,y2);ctx.stroke()
      ctx.shadowBlur=0
      ctx.strokeStyle=rgba(color,.4*alpha);ctx.lineWidth=Math.max(12,width*.018)
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()
      ctx.restore()
    }

    const drawPowerWake = (x1:number,y1:number,x2:number,y2:number,power:Power,t:number) => {
      const dx=x2-x1,dy=y2-y1,dir=dx>=0?1:-1
      // Contrast rail: a restrained navy edge keeps every coloured power readable
      // against the user's bright original arena without changing the background.
      ctx.save()
      ctx.globalCompositeOperation='source-over'
      ctx.lineCap='round'
      ctx.strokeStyle='rgba(3,25,54,.34)'
      ctx.lineWidth=Math.max(10,width*.024)
      ctx.shadowColor='rgba(2,18,42,.24)'
      ctx.shadowBlur=9
      ctx.beginPath()
      ctx.moveTo(x1,y1)
      ctx.quadraticCurveTo(x1+dx*.5,y1+dy*.5+Math.sin(t*4)*8,x2,y2)
      ctx.stroke()
      ctx.restore()
      if(power.name==='TIDAL DRAGON'){
        // Broad, readable water wake with multiple rolling ribbons and bubbles.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<7;k++){
          const offset=(k-3)*7
          ctx.strokeStyle=rgba(k%2?'#38cfff':'#087fc4',.78-k*.055)
          ctx.lineWidth=8+(k%3)*3
          ctx.shadowColor='#24bfff';ctx.shadowBlur=10
          ctx.beginPath();ctx.moveTo(x1,y1+offset)
          ctx.bezierCurveTo(x1+dx*.24,y1+dy*.24+Math.sin(t*5+k)*24+offset,
            x1+dx*.72,y1+dy*.72+Math.cos(t*4+k)*22-offset*.5,x2,y2+offset*.35)
          ctx.stroke()
        }
        for(let k=0;k<9;k++){const q=(k+1)/10;const bx=x1+dx*q,by=y1+dy*q+Math.sin(t*4+k)*15;ctx.fillStyle='rgba(88,218,255,.92)';ctx.beginPath();ctx.arc(bx,by,2+(k%3),0,Math.PI*2);ctx.fill()}
        ctx.restore()
      } else if(power.name==='METEOR KICK'){
        // Fiery comet wake with turbulent tongues, sparks and a smoky core.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<8;k++){
          const off=(k-3.5)*5, wave=Math.sin(t*12+k*1.6)*17
          ctx.strokeStyle=rgba(k%2?'#ffe8ad':'#ff5727',.78-k*.055)
          ctx.lineWidth=5+(k%3)*3;ctx.shadowColor='#ff5a20';ctx.shadowBlur=18
          ctx.beginPath();ctx.moveTo(x1,y1+off)
          ctx.bezierCurveTo(x1+dx*.28,y1+dy*.28+wave+off,
            x1+dx*.72,y1+dy*.72-wave*.6+off*.5,x2,y2+off*.25)
          ctx.stroke()
        }
        for(let k=0;k<4;k++){const q=(k+1)/5;addBurst(x1+dx*q,y1+dy*q+rand(-9,9),'#ff8a32',2,45)}
        ctx.restore()
      } else if(power.type==='FIRE'){
        // Ember drift and heat shimmer trail; the detailed flame texture is the projectile body.
        for(let k=0;k<4;k++){
          const q=(k+1)/5, x=x1+dx*q, y=y1+dy*q+Math.sin(t*10+k*1.7)*9
          ctx.save();ctx.globalAlpha=.16+q*.2;ctx.fillStyle='#ff9a4a';ctx.shadowColor='#ff6b28';ctx.shadowBlur=16
          ctx.beginPath();ctx.ellipse(x,y,5+q*4,2+q*2,Math.atan2(dy,dx),0,Math.PI*2);ctx.fill();ctx.restore()
        }
        if(Math.random()<.7) addBurst(x2,y2,power.color,2,58)
      } else if(power.type==='LIGHTNING'){
        ctx.save();ctx.strokeStyle=rgba('#b9edff',.9);ctx.lineWidth=2.5;ctx.shadowColor=power.color;ctx.shadowBlur=14
        for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*5);let x=x1,y=y1+(k-1.5)*5
          for(let n=1;n<=8;n++){x=x1+dx*n/8;y=y1+dy*n/8+Math.sin(t*17+n*2+k)*11;ctx.lineTo(x,y)}ctx.stroke()}
        ctx.restore()
      } else if(power.type==='WATER'){
        ctx.save();ctx.lineCap='round'
        for(let k=0;k<4;k++){ctx.strokeStyle=rgba(k%2?'#4bd8ff':power.color,.78);ctx.lineWidth=7+k*2;ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*7);ctx.bezierCurveTo(x1+dx*.3,y1+dy*.3+Math.sin(t*5+k)*28,x1+dx*.7,y1+dy*.7+Math.cos(t*5+k)*28,x2,y2+(k-1.5)*5);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='ICE'){
        ctx.save();ctx.strokeStyle=rgba('#dffaff',.8);ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.lineDashOffset=-t*45;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()
      } else if(power.type==='SHADOW'){
        ctx.save();ctx.strokeStyle=rgba(power.color,.45);ctx.lineWidth=width*.035;ctx.shadowColor=power.color;ctx.shadowBlur=24;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+Math.sin(t*3)*30,x2,y2);ctx.stroke();ctx.restore()
      } else if(power.type==='SOLAR'){
        // A broad, layered solar stream with visible rays and a hot travelling centre.
        ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='source-over'
        const grad=ctx.createLinearGradient(x1,y1,x2,y2);grad.addColorStop(0,rgba(power.color,0));grad.addColorStop(.48,rgba(power.color,.2));grad.addColorStop(1,'rgba(255,255,230,.95)')
        for(let k=0;k<5;k++){ctx.strokeStyle=k===2?grad:rgba(k%2?'#fff4bd':power.color,.42);ctx.lineWidth=k===2?width*.055:width*(.012+k*.002);ctx.shadowColor=power.color;ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(x1,y1+(k-2)*5);ctx.bezierCurveTo(x1+dx*.32,y1+dy*.32+Math.sin(t*7+k)*18,x1+dx*.7,y1+dy*.7+Math.cos(t*6+k)*16,x2,y2+(k-2)*3);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='PLASMA'){
        // Plasma has a wide ion wake, not a thin straight beam.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<6;k++){const wave=Math.sin(t*10+k*1.35)*12;ctx.strokeStyle=rgba(k%2?'#ffffff':power.color,.68-k*.07);ctx.lineWidth=width*(k===2?.024:.009);ctx.shadowColor=power.color;ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(x1,y1+(k-2.5)*7);ctx.bezierCurveTo(x1+dx*.28,y1+dy*.28+wave,x1+dx*.72,y1+dy*.72-wave*.65,x2,y2+(k-2.5)*5);ctx.stroke()}
        ctx.restore()
      } else if(power.type==='SHADOW'){
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        for(let k=0;k<4;k++){ctx.strokeStyle=rgba(k%2?'#e8d8ff':power.color,.38);ctx.lineWidth=width*(.018+k*.004);ctx.shadowColor=power.color;ctx.shadowBlur=25;ctx.beginPath();ctx.moveTo(x1,y1+(k-1.5)*9);ctx.bezierCurveTo(x1+dx*.25,y1+dy*.25+Math.sin(t*5+k)*25,x1+dx*.72,y1+dy*.72+Math.cos(t*5+k)*22,x2,y2);ctx.stroke()}
        ctx.restore()
      } else {
        // Every remaining power gets a visible tapered, multi-strand wake.
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round'
        const grad=ctx.createLinearGradient(x1,y1,x2,y2);grad.addColorStop(0,rgba(power.color,0));grad.addColorStop(.55,rgba(power.color,.24));grad.addColorStop(1,rgba(power.color,.92))
        for(let k=0;k<5;k++){ctx.strokeStyle=k===2?grad:rgba(power.color,.38-k*.045);ctx.lineWidth=width*(k===2?.045:.009);ctx.shadowColor=power.color;ctx.shadowBlur=17;ctx.beginPath();ctx.moveTo(x1,y1+(k-2)*7);ctx.quadraticCurveTo(x1+dx*.52,y1+dy*.52+Math.sin(t*8+k)*17,x2,y2+(k-2)*4);ctx.stroke()}
        ctx.restore()
        if(Math.random()<.8) addBurst(x2,y2,power.color,3,58)
      }
    }

    // Authored transparent elemental artwork is the projectile itself. The
    // canvas animates its travel, scale, rotation, wake and impact separately.
    const drawAuthoredPowerArt = (x:number,y:number,dir:number,power:Power,t:number,scale=1,alpha=1) => {
      const image = powerSprites[powerArtworkKey(power)]
      if (!image || !image.complete || !image.naturalWidth) return
      const base = Math.max(26, width * .034) * scale
      const drawW = base * 5.1
      const drawH = drawW * (image.naturalHeight / image.naturalWidth)
      const pulse = 1 + Math.sin(t * 8.5) * .035
      ctx.save(); ctx.translate(x,y); ctx.scale(dir * pulse,pulse)
      ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'source-over'
      ctx.shadowColor = power.color; ctx.shadowBlur = Math.max(8, base * .48)
      ctx.drawImage(image,-drawW*.5,-drawH*.5,drawW,drawH)
      ctx.restore()
    }

    const drawImpact = (x:number,y:number,power:Power,t:number) => {
      const progress=Math.min(1,t)
      const radius=14+progress*width*.155
      ctx.save();ctx.globalAlpha=1-progress
      const g=ctx.createRadialGradient(x,y,1,x,y,radius)
      g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,rgba(power.color,.95));g.addColorStop(1,rgba(power.color,0))
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill()
      const impactTexture=powerSprites['impact']
      if(impactTexture?.complete&&impactTexture.naturalWidth){ctx.globalAlpha=.82*(1-progress);ctx.drawImage(impactTexture,x-radius*1.08,y-radius*1.08,radius*2.16,radius*2.16);ctx.globalAlpha=1-progress}
      for(let ring=0;ring<5;ring++){ctx.strokeStyle=rgba(ring%2===0?'#ffffff':power.color,1-progress);ctx.lineWidth=ring===0?6:3;ctx.beginPath();ctx.arc(x,y,radius*(.32+ring*.17),0,Math.PI*2);ctx.stroke()}
      ctx.strokeStyle=rgba('#ffffff',.72*(1-progress));ctx.lineWidth=2;for(let ray=0;ray<18;ray++){const a=ray*Math.PI/9;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*radius*.25,y+Math.sin(a)*radius*.25);ctx.lineTo(x+Math.cos(a)*radius*1.18,y+Math.sin(a)*radius*1.18);ctx.stroke()}
      ctx.restore()
    }

    const drawAnimeFighter = (x:number, floorY:number, side:Side, beatName:string, t:number, isWinner:boolean, isVictim:boolean, accent:string) => {
      const ownPower = side === 'blue' ? bluePower : redPower
      const prefix = side
      let pose = 'idle'
      if (isVictim && beatName === 'impact') pose = 'hurt'
      else if (beatName === 'release' || beatName === 'breakthrough') pose = ['IMPACT','SPEED'].includes(ownPower.type) ? 'kick' : 'punch'
      else if (beatName === 'recovery') pose = 'idle'

      // Specific cast artwork exists for the most visually distinctive moves;
      // other powers use the fighter's own punch/kick pose plus their own VFX.
      const castMap: Record<string,string> = side === 'blue'
        ? { LIGHTNING:'blue-lightning-cast', WATER:'blue-water-cast', SHIELD:'blue-shield-cast' }
        : { FIRE:'red-fire-cast', SOLAR:'red-solar-cast', SHIELD:'red-shield-cast' }
      const castSprite = castMap[ownPower.type]
      const spriteKey = (beatName === 'windup' || beatName === 'release' || beatName === 'breakthrough') && castSprite
        ? castSprite
        : (pose === 'hurt' ? `${prefix}-uhd` : (pose === 'idle' ? `${prefix}-uhd` : `${prefix}-${pose}`))
      const sprite = fighterSprites[spriteKey] || fighterSprites[`${prefix}-uhd`]
      if (!sprite || !sprite.complete || !sprite.naturalWidth) return

      const bob = beatName === 'charge' ? Math.sin(t * 8 + (side === 'red' ? 1.2 : 0)) * 3.2 : Math.sin(t * 4.8) * 1.4
      const lean = beatName === 'windup' ? (side === 'blue' ? .035 : -.035)
        : (beatName === 'release' || beatName === 'breakthrough') ? (isWinner ? (side === 'blue' ? .055 : -.055) : 0)
        : beatName === 'impact' && isVictim ? (side === 'blue' ? -.16 : .16) : 0
      const lunge = (beatName === 'release' || beatName === 'breakthrough') && isWinner ? (side === 'blue' ? 1 : -1) * width * .012 * Math.sin(t * 5) : 0
      const spriteH = Math.min(height * .93, width * .285)
      const spriteW = spriteH * (sprite.naturalWidth / sprite.naturalHeight)

      ctx.save()
      ctx.translate(x + lunge, floorY + bob)
      ctx.rotate(lean)
      // Character contact shadow, kept separate from the transparent artwork.
      ctx.fillStyle = 'rgba(22,55,82,.20)'
      ctx.beginPath(); ctx.ellipse(0, 2, spriteW * .27, Math.max(7, spriteH * .026), 0, 0, Math.PI * 2); ctx.fill()
      if (beatName === 'charge' || beatName === 'windup') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .13 + Math.sin(t * 8) * .035
        ctx.strokeStyle = accent; ctx.lineWidth = 3
        for (let ring = 0; ring < 3; ring++) {
          ctx.beginPath(); ctx.ellipse(0, -spriteH * .48, spriteW * (.24 + ring * .055), spriteH * (.31 + ring * .035), t * .15 * (ring + 1), 0, Math.PI * 2); ctx.stroke()
        }
        ctx.restore()
      }
      ctx.shadowColor = accent
      ctx.shadowBlur = beatName === 'release' || beatName === 'breakthrough' ? 17 : beatName === 'charge' ? 12 : 4
      // Idle/punch/kick red poses already face inward. The red casting tiles
      // were authored facing right, so mirror only those cast illustrations.
      if (side === 'red' && spriteKey.endsWith('-cast')) ctx.scale(-1, 1)
      ctx.drawImage(sprite, -spriteW * .5, -spriteH, spriteW, spriteH)
      ctx.restore()
    }

    const powerArtworkKey = (power:Power) => {
      if (power.name === 'TIDAL DRAGON') return 'water-dragon'
      if (power.name === 'OCEAN SPIRAL') return 'water-vortex'
      if (power.name === 'PHOENIX ROAR') return 'phoenix'
      if (power.name === 'FROST NOVA') return 'frost-nova'
      if (power.name === 'GUARDIAN AEGIS') return 'guardian-aegis'
      if (power.name === 'MEND AURA') return 'mend-aura'
      if (power.type === 'LIGHTNING') return 'lightning'
      if (power.type === 'FIRE') return 'fire'
      if (power.type === 'ICE') return 'ice'
      if (power.type === 'SHADOW') return 'shadow'
      if (power.type === 'SOLAR') return 'solar'
      if (power.type === 'WIND') return 'wind'
      if (power.type === 'SHIELD') return 'shield'
      if (power.type === 'IMPACT') return 'impact'
      if (power.type === 'PLASMA') return 'plasma'
      if (power.type === 'SPEED') return 'speed'
      if (power.type === 'WATER') return 'water-dragon'
      return 'mend-aura'
    }


    const frame=(now:number)=>{
      const dt=Math.min(.04,(now-last)/1000);last=now
      const elapsed=(now-start)/1000
      ctx.clearRect(0,0,width,height)
      const midX=width*.5, midY=height*.355
      const blueStart={x:width*.355,y:height*.325}
      const redStart={x:width*.645,y:height*.325}
      // Supplied character illustrations animate through distinct authored poses and continuous transforms.
      drawAnimeFighter(width*.205, height*.91, 'blue', valuesRef.current.beat, elapsed, winningSide==='blue', impactSide==='blue' && valuesRef.current.beat==='impact', valuesRef.current.blueAccent)
      drawAnimeFighter(width*.795, height*.91, 'red', valuesRef.current.beat, elapsed, winningSide==='red', impactSide==='red' && valuesRef.current.beat==='impact', valuesRef.current.redAccent)
      const target=impactSide==='blue'?{x:width*.235,y:height*.385}:{x:width*.765,y:height*.385}
      const source=winningSide==='blue'?blueStart:redStart
      const winnerPower=winningSide==='blue'?bluePower:redPower
      const loserPower=winningSide==='blue'?redPower:bluePower
      const phaseProgress=(a:number,b:number)=>Math.max(0,Math.min(1,(elapsed-a)/(b-a)))
      const ease=(v:number)=>v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2
      const release=phaseProgress(.65,1.9)
      const collide=phaseProgress(1.9,2.3)
      const breakthrough=phaseProgress(2.3,3.2)
      const impact=phaseProgress(2.75,3.2)

      // Energy accumulates visibly at both hands before anything is fired.
      if(elapsed<.65){
        const charge=Math.min(1,elapsed/.65)
        const blueDefensive=['SHIELD','HEAL'].includes(bluePower.type)
        const redDefensive=['SHIELD','HEAL'].includes(redPower.type)
        if(!blueDefensive) {
          drawAuthoredPowerArt(blueStart.x,blueStart.y,1,bluePower,elapsed,.72+charge*.62,.72+charge*.28)
          drawOrb(blueStart.x,blueStart.y,9+charge*16,bluePower.color,bluePower,elapsed,.42+charge*.42)
        }
        if(!redDefensive) {
          drawAuthoredPowerArt(redStart.x,redStart.y,-1,redPower,elapsed,.72+charge*.62,.72+charge*.28)
          drawOrb(redStart.x,redStart.y,9+charge*16,redPower.color,redPower,elapsed,.42+charge*.42)
        }
        if(blueDefensive) drawAuthoredPowerArt(blueStart.x,blueStart.y-38,1,bluePower,elapsed,.9+charge*.45,.78+charge*.22)
        if(redDefensive) drawAuthoredPowerArt(redStart.x,redStart.y-38,-1,redPower,elapsed,.9+charge*.45,.78+charge*.22)
        for(let i=0;i<2;i++){
          const origin=i===0?blueStart:redStart
          const power=i===0?bluePower:redPower
          if(Math.random()<.65){const a=rand(0,Math.PI*2),r=rand(14,36);particles.push({x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r,vx:Math.cos(a)*rand(5,26),vy:Math.sin(a)*rand(5,26),life:.45,max:.45,size:rand(1,3),hue:power.type==='FIRE'?25:195,alpha:.9})}
        }
      }

      // The two real projectiles travel to a centre clash; no power-art images.
      if(elapsed>=.65 && elapsed<2.3){
        const p=release
        const e=ease(p)
        const bx=blueStart.x+(midX-blueStart.x)*e
        const rx=redStart.x+(midX-redStart.x)*e
        const separation=Math.sin(p*Math.PI*.5)*Math.min(22,height*.035)
        const by=blueStart.y+(midY-blueStart.y)*e+Math.sin(p*Math.PI)*-height*.035-separation
        const ry=redStart.y+(midY-redStart.y)*e+Math.sin(p*Math.PI)*-height*.035+separation
        drawPowerWake(blueStart.x,blueStart.y,bx,by,bluePower,elapsed)
        drawPowerWake(redStart.x,redStart.y,rx,ry,redPower,elapsed)
        drawAuthoredPowerArt(bx,by,1,bluePower,elapsed,2.12,1)
        drawAuthoredPowerArt(rx,ry,-1,redPower,elapsed,2.12,1)
        if(elapsed>1.9){
          const pulse=1+Math.sin(now*.018)*.14
          ctx.save();ctx.globalAlpha=1-collide*.35;ctx.shadowColor=winnerPower.color;ctx.shadowBlur=42
          for(let ring=0;ring<4;ring++){
            ctx.strokeStyle=ring%2?'rgba(255,255,255,.9)':rgba(ring%3===0?bluePower.color:redPower.color,.82)
            ctx.lineWidth=ring===0?5:2.5
            ctx.beginPath();ctx.arc(midX,midY,(18+ring*12)*pulse+collide*width*.09,0,Math.PI*2);ctx.stroke()
          }
          ctx.restore()
          if(Math.random()<.8) addBurst(midX+rand(-18,18),midY+rand(-18,18),winnerPower.color,7,155)
        }
      }

      // Losing energy collapses; the winning projectile surges through the clash.
      if(elapsed>=2.3 && elapsed<3.2){
        const p=ease(breakthrough)
        const x=midX+(target.x-midX)*p
        const y=midY+(target.y-midY)*p
        const loserFade=1-breakthrough
        drawPowerWake(midX,midY,x,y,winnerPower,elapsed)
        drawAuthoredPowerArt(x,y,Math.sign(target.x-midX),winnerPower,elapsed,2.08+breakthrough*.24,1)
        drawAuthoredPowerArt(midX,midY,winningSide==='blue'?-1:1,loserPower,elapsed,.46,loserFade*.45)
        drawOrb(midX,midY,Math.max(1,26*loserFade),loserPower.color,loserPower,elapsed,loserFade*.45)
      }

      if(elapsed>=2.75 && elapsed<3.3) {
        drawImpact(target.x,target.y,winnerPower,impact)
        if (Math.random() < .72) addBurst(target.x,target.y,winnerPower.color,11,175)
      }

      // Procedural sparks and motes: each particle has its own velocity, drag and lifetime.
      for(let i=particles.length-1;i>=0;i--){
        const q=particles[i];q.life-=dt
        if(q.life<=0){particles.splice(i,1);continue}
        q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.12,dt);q.vy=q.vy*.985+18*dt
        const alpha=(q.life/q.max)*q.alpha
        ctx.fillStyle=`hsla(${q.hue},100%,${q.hue===25?65:78}%,${alpha})`
        ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=q.size*3
        ctx.beginPath();ctx.arc(q.x,q.y,q.size*(.35+.65*q.life/q.max),0,Math.PI*2);ctx.fill()
      }
      ctx.shadowBlur=0

      // Continuous sparks are emitted along the advancing winning bolt.
      if(elapsed>.65 && elapsed<3.2 && Math.random()<.9){
        const t=elapsed<2.3?release:breakthrough
        const x=elapsed<2.3?source.x+(midX-source.x)*ease(t):midX+(target.x-midX)*ease(t)
        const y=elapsed<2.3?source.y+(midY-source.y)*ease(t):midY+(target.y-midY)*ease(t)
        addBurst(x+rand(-8,8),y+rand(-8,8),winnerPower.color,2,70)
      }
      raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame)
    return ()=>{cancelAnimationFrame(raf);observer.disconnect()}
  }, [bluePower.name, redPower.name, winningSide, impactSide, blueAccent, redAccent])

  return <canvas ref={canvasRef} className="gc-live-power-canvas" aria-hidden="true" />
}
