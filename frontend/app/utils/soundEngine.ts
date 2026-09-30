let audioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function playCustomSound(
  soundTypeOrUrl: string,
  volume: number = 0.8,
  customSounds: { id: string; dataUrl: string }[] = []
) {
  if (typeof window === 'undefined' || !soundTypeOrUrl || soundTypeOrUrl === 'none') return

  const vol = Math.max(0, Math.min(1, volume))

  // 1. Check custom user uploaded sound ID
  if (customSounds && customSounds.length > 0) {
    const match = customSounds.find(s => s.id === soundTypeOrUrl)
    if (match && match.dataUrl) {
      try {
        const audio = new Audio(match.dataUrl)
        audio.volume = vol
        audio.play().catch((err) => {
          console.warn('Custom audio playback blocked/failed:', err)
        })
      } catch {}
      return
    }
  }

  // 2. Check explicit URLs / paths / data URLs / mp3 files
  if (
    soundTypeOrUrl.startsWith('http') ||
    soundTypeOrUrl.startsWith('/') ||
    soundTypeOrUrl.startsWith('data:') ||
    soundTypeOrUrl.endsWith('.mp3') ||
    soundTypeOrUrl.endsWith('.wav')
  ) {
    try {
      const audio = new Audio(soundTypeOrUrl)
      audio.volume = vol
      audio.play().catch(() => {})
    } catch {}
    return
  }

  // 3. Named MP3 sound assets fallback ('tick', 'start', 'end')
  if (soundTypeOrUrl === 'tick') {
    try {
      const audio = new Audio('/sounds/tick.mp3')
      audio.volume = vol
      audio.play().then(() => {}).catch(() => {
        synthesizeSound('tick', vol)
      })
      return
    } catch {
      synthesizeSound('tick', vol)
      return
    }
  }

  if (soundTypeOrUrl === 'start') {
    try {
      const audio = new Audio('/sounds/start.mp3')
      audio.volume = vol
      audio.play().then(() => {}).catch(() => {
        synthesizeSound('chime', vol)
      })
      return
    } catch {
      synthesizeSound('chime', vol)
      return
    }
  }

  if (soundTypeOrUrl === 'end') {
    try {
      const audio = new Audio('/sounds/end.mp3')
      audio.volume = vol
      audio.play().then(() => {}).catch(() => {
        synthesizeSound('bell', vol)
      })
      return
    } catch {
      synthesizeSound('bell', vol)
      return
    }
  }

  // 4. Synthesize sound via Web Audio API
  synthesizeSound(soundTypeOrUrl, vol)
}

function synthesizeSound(soundType: string, vol: number) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime

  try {
    switch (soundType) {
      case 'tick':
      case 'click': {
        // Crisp dual-tone woodblock click (high audible impulse)
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(1200, now)
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.06)

        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(800, now)
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.06)

        gain.gain.setValueAtTime(vol * 0.8, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.06)
        osc2.stop(now + 0.06)
        break
      }
      case 'chime': {
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(523.25, now) // C5
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(659.25, now + 0.08) // E5

        gain.gain.setValueAtTime(vol * 0.7, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc1.stop(now + 1.0)
        osc2.start(now + 0.08)
        osc2.stop(now + 1.0)
        break
      }
      case 'bell': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        gain.gain.setValueAtTime(vol * 0.8, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.5)
        break
      }
      case 'beep': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, now)
        gain.gain.setValueAtTime(vol * 0.6, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
      case 'buzz': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, now)
        gain.gain.setValueAtTime(vol * 0.6, now)
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.5)
        break
      }
      default: {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, now)
        gain.gain.setValueAtTime(vol * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
        break
      }
    }
  } catch (err) {
    console.error('Audio synthesis error:', err)
  }
}
