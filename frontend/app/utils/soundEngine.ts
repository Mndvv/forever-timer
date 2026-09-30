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
  if (!soundTypeOrUrl || soundTypeOrUrl === 'none') return

  // Check if soundTypeOrUrl matches a custom sound ID from registered custom sounds
  if (customSounds && customSounds.length > 0) {
    const match = customSounds.find(s => s.id === soundTypeOrUrl)
    if (match && match.dataUrl) {
      try {
        const audio = new Audio(match.dataUrl)
        audio.volume = Math.max(0, Math.min(1, volume))
        audio.play().catch(() => {})
      } catch {}
      return
    }
  }

  // If it's a URL, path, Data URL, or audio file
  if (
    soundTypeOrUrl.startsWith('http') ||
    soundTypeOrUrl.startsWith('/') ||
    soundTypeOrUrl.startsWith('data:') ||
    soundTypeOrUrl.endsWith('.mp3') ||
    soundTypeOrUrl.endsWith('.wav')
  ) {
    try {
      const audio = new Audio(soundTypeOrUrl)
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.play().catch(() => {})
    } catch {}
    return
  }

  // Synthesize sound via Web Audio API
  const ctx = getAudioContext()
  if (!ctx) return

  const vol = Math.max(0, Math.min(1, volume))
  const now = ctx.currentTime

  try {
    switch (soundTypeOrUrl) {
      case 'chime': {
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(523.25, now)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(659.25, now + 0.08)

        gain.gain.setValueAtTime(vol * 0.45, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc1.stop(now + 0.9)
        osc2.start(now + 0.08)
        osc2.stop(now + 0.9)
        break
      }
      case 'bell': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        gain.gain.setValueAtTime(vol * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.2)
        break
      }
      case 'beep': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, now)
        gain.gain.setValueAtTime(vol * 0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
        break
      }
      case 'tick':
      case 'click': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1400, now)
        gain.gain.setValueAtTime(vol * 0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
        break
      }
      case 'buzz': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, now)
        gain.gain.setValueAtTime(vol * 0.35, now)
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.4)
        break
      }
      default: {
        // Fallback tone
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, now)
        gain.gain.setValueAtTime(vol * 0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
    }
  } catch (err) {
    console.error('Audio synthesis error:', err)
  }
}
