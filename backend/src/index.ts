import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

export interface AlertRule {
  id: string
  name: string
  triggerAt: number       // in seconds remaining (can be positive or <= 0 for overtime)
  textColor?: string      // text color to switch to
  bgColor?: string        // background color to switch to
  flash?: boolean         // whether to pulse/flash
  sound?: string          // 'chime' | 'bell' | 'beep' | 'tick' | 'buzz' | 'none' or custom sound id
  soundEverySecond?: boolean // play sound on every second tick while rule is active
}

export interface CustomSound {
  id: string
  name: string
  dataUrl: string         // Base64 Data URL or audio URI
}

export interface TimerPreset {
  id: string
  name: string
  config: TimerConfig
  timers?: TimerItem[]
  createdAt: string
}

export interface SoundConfig {
  enableChimes: boolean
  startSound: string       // 'chime' | 'bell' | 'beep' | 'none' or custom sound id
  endSound: string         // 'bell' | 'chime' | 'buzz' | 'none' or custom sound id
  tickSound: string        // 'tick' | 'click' | 'beep' | 'none' or custom sound id
  tickUnderXSeconds: number
  volume: number           // 0.0 to 1.0
  customSounds?: CustomSound[]
}

export interface TimerAppearanceConfig {
  defaultTextColor: string
  fontFamily: string
  defaultBgColor: string
  textShadowOpacity: number     // 0.0 to 1.0
  showOvertimeBg: boolean       // enable/disable background on overtime text
  overtimeBgColor: string       // background color for overtime badge
  showOvertimeBorder: boolean   // enable/disable border
  showOvertimeShadow: boolean   // enable/disable shadow
  overtimeTextColor: string     // text color for overtime
  overtimeLabel: string         // label (e.g. 'OVERTIME' or empty)
  animateOvertime: boolean      // enable/disable animation
}

export interface TimerConfig {
  appearance: TimerAppearanceConfig
  rules: AlertRule[]
  sound: SoundConfig
  countOvertime: boolean   // true = keep counting past zero into negative
  customSounds?: CustomSound[]
  presets?: TimerPreset[]
}

export interface TimerItem {
  id: string
  title: string
  speakerName: string
  duration: number       // total duration in seconds
  timeRemaining: number  // current remaining in seconds (can be negative in overtime)
}

const defaultConfig: TimerConfig = {
  appearance: {
    defaultTextColor: '#34d399',
    fontFamily: 'monospace',
    defaultBgColor: 'transparent',
    textShadowOpacity: 0.8,
    showOvertimeBg: true,
    overtimeBgColor: 'rgba(69, 10, 10, 0.8)',
    showOvertimeBorder: true,
    showOvertimeShadow: true,
    overtimeTextColor: '#f87171',
    overtimeLabel: 'OVERTIME',
    animateOvertime: true
  },
  rules: [
    {
      id: 'rule-warning',
      name: 'Warning (30s)',
      triggerAt: 30,
      textColor: '#facc15',
      bgColor: 'transparent',
      flash: false,
      sound: 'none',
      soundEverySecond: false
    },
    {
      id: 'rule-danger',
      name: 'Danger (10s)',
      triggerAt: 10,
      textColor: '#fb923c',
      bgColor: 'transparent',
      flash: false,
      sound: 'tick',
      soundEverySecond: false
    },
    {
      id: 'rule-urgent',
      name: 'Urgent (5s)',
      triggerAt: 5,
      textColor: '#ef4444',
      bgColor: 'transparent',
      flash: true,
      sound: 'beep',
      soundEverySecond: true
    },
    {
      id: 'rule-end',
      name: 'Time Up (0s)',
      triggerAt: 0,
      textColor: '#ef4444',
      bgColor: 'transparent',
      flash: true,
      sound: 'bell',
      soundEverySecond: false
    },
    {
      id: 'rule-overtime',
      name: 'Overtime (-30s)',
      triggerAt: -30,
      textColor: '#dc2626',
      bgColor: 'transparent',
      flash: true,
      sound: 'buzz',
      soundEverySecond: false
    }
  ],
  sound: {
    enableChimes: true,
    startSound: 'chime',
    endSound: 'bell',
    tickSound: 'tick',
    tickUnderXSeconds: 5,
    volume: 0.8,
    customSounds: []
  },
  countOvertime: true,
  customSounds: [],
  presets: []
}

// In-memory multi-timer state
let timers: TimerItem[] = [
  {
    id: 'timer-1',
    title: 'Opening Remarks',
    speakerName: 'Moderator',
    duration: 180,
    timeRemaining: 180
  },
  {
    id: 'timer-2',
    title: 'Affirmative Constructive',
    speakerName: '1st Affirmative',
    duration: 300,
    timeRemaining: 300
  },
  {
    id: 'timer-3',
    title: 'Negative Constructive',
    speakerName: '1st Negative',
    duration: 300,
    timeRemaining: 300
  },
  {
    id: 'timer-4',
    title: 'Rebuttal & Cross-Ex',
    speakerName: 'Open Floor',
    duration: 120,
    timeRemaining: 120
  }
]

let activeTimerId = 'timer-1'
let status: 'idle' | 'running' | 'paused' = 'idle'
let config: TimerConfig = JSON.parse(JSON.stringify(defaultConfig))
let timerInterval: ReturnType<typeof setInterval> | null = null

function getActiveTimer(): TimerItem {
  let found = timers.find(t => t.id === activeTimerId)
  if (!found && timers.length > 0) {
    found = timers[0]
    activeTimerId = found!.id
  }
  if (!found) {
    const fallback: TimerItem = {
      id: 'timer-default',
      title: 'Debate Timer',
      speakerName: '',
      duration: 300,
      timeRemaining: 300
    }
    timers.push(fallback)
    activeTimerId = fallback.id
    return fallback
  }
  return found
}

function getTimerState() {
  const active = getActiveTimer()
  return {
    type: 'TICK',
    activeTimerId: active.id,
    timeRemaining: active.timeRemaining,
    duration: active.duration,
    status,
    speakerName: active.speakerName,
    title: active.title,
    timers,
    config
  }
}

// Active connected WebSocket clients
const clients = new Set<any>()

function broadcast() {
  const message = JSON.stringify(getTimerState())
  for (const ws of clients) {
    try {
      ws.send(message)
    } catch {
      clients.delete(ws)
    }
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimer() {
  if (timerInterval) return

  status = 'running'
  broadcast()

  timerInterval = setInterval(() => {
    const current = getActiveTimer()
    current.timeRemaining--
    if (!config.countOvertime && current.timeRemaining <= 0) {
      current.timeRemaining = 0
      status = 'idle'
      stopTimer()
    }
    broadcast()
  }, 1000)
}

function pauseTimer() {
  stopTimer()
  status = 'paused'
  broadcast()
}

function togglePlay() {
  if (status === 'running') {
    pauseTimer()
  } else {
    startTimer()
  }
}

function resetTimer() {
  stopTimer()
  const active = getActiveTimer()
  active.timeRemaining = active.duration
  status = 'idle'
  broadcast()
}

function setTime(seconds: number) {
  const active = getActiveTimer()
  // When setting manually, clamp between negative overtime and active.duration
  active.timeRemaining = Math.min(active.duration, Math.floor(seconds))
  broadcast()
}

function setDuration(seconds: number) {
  const active = getActiveTimer()
  const dur = Math.max(1, Math.floor(seconds))
  active.duration = dur
  if (active.timeRemaining > dur || status === 'idle') {
    active.timeRemaining = dur
  }
  broadcast()
}

function setSpeaker(name: string) {
  const active = getActiveTimer()
  active.speakerName = name
  broadcast()
}

function setTitle(title: string) {
  const active = getActiveTimer()
  active.title = title
  broadcast()
}

function selectTimer(id: string) {
  if (activeTimerId === id) return
  stopTimer()
  status = 'idle'
  activeTimerId = id
  broadcast()
}

function nextTimer() {
  stopTimer()
  status = 'idle'
  const index = timers.findIndex(t => t.id === activeTimerId)
  if (index >= 0 && index < timers.length - 1) {
    activeTimerId = timers[index + 1]!.id
  }
  broadcast()
}

function prevTimer() {
  stopTimer()
  status = 'idle'
  const index = timers.findIndex(t => t.id === activeTimerId)
  if (index > 0) {
    activeTimerId = timers[index - 1]!.id
  }
  broadcast()
}

function addTimer(data: { title?: string; speakerName?: string; duration?: number }) {
  const dur = Math.max(1, Math.floor(data.duration || 300))
  const newTimer: TimerItem = {
    id: `timer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: data.title || `Timer ${timers.length + 1}`,
    speakerName: data.speakerName || '',
    duration: dur,
    timeRemaining: dur
  }
  timers.push(newTimer)
  broadcast()
}

function updateTimer(data: { id: string; title?: string; speakerName?: string; duration?: number; timeRemaining?: number }) {
  const target = timers.find(t => t.id === data.id)
  if (!target) return

  if (typeof data.title === 'string') target.title = data.title
  if (typeof data.speakerName === 'string') target.speakerName = data.speakerName
  if (typeof data.duration === 'number') {
    const dur = Math.max(1, Math.floor(data.duration))
    target.duration = dur
    if (target.timeRemaining > dur || status === 'idle') {
      target.timeRemaining = dur
    }
  }
  if (typeof data.timeRemaining === 'number') {
    target.timeRemaining = Math.min(target.duration, Math.floor(data.timeRemaining))
  }
  broadcast()
}

function deleteTimer(id: string) {
  if (timers.length <= 1) return // keep at least one timer

  const index = timers.findIndex(t => t.id === id)
  if (index !== -1) {
    if (activeTimerId === id) {
      stopTimer()
      status = 'idle'
      const nextActive = timers[index + 1] || timers[index - 1]
      if (nextActive) {
        activeTimerId = nextActive.id
      }
    }
    timers.splice(index, 1)
  }
  broadcast()
}

function updateConfig(newConfig: Partial<TimerConfig>) {
  if (!newConfig || typeof newConfig !== 'object') return

  if (newConfig.appearance && typeof newConfig.appearance === 'object') {
    config.appearance = { ...config.appearance, ...newConfig.appearance }
  }
  if (Array.isArray(newConfig.rules)) {
    config.rules = newConfig.rules
  }
  if (newConfig.sound && typeof newConfig.sound === 'object') {
    config.sound = { ...config.sound, ...newConfig.sound }
  }
  if (typeof newConfig.countOvertime === 'boolean') {
    config.countOvertime = newConfig.countOvertime
  }
  if (Array.isArray(newConfig.customSounds)) {
    config.customSounds = newConfig.customSounds
    config.sound.customSounds = newConfig.customSounds
  }
  if (Array.isArray(newConfig.presets)) {
    config.presets = newConfig.presets
  }

  broadcast()
}

function savePreset(name: string) {
  if (!name || !name.trim()) return
  if (!config.presets) config.presets = []
  const newPreset: TimerPreset = {
    id: `preset-${Date.now()}`,
    name: name.trim(),
    config: JSON.parse(JSON.stringify(config)),
    timers: JSON.parse(JSON.stringify(timers)),
    createdAt: new Date().toISOString()
  }
  config.presets.push(newPreset)
  broadcast()
}

function loadPreset(id: string) {
  if (!config.presets) return
  const found = config.presets.find(p => p.id === id)
  if (!found) return
  stopTimer()
  status = 'idle'
  const preservedPresets = config.presets
  const preservedCustomSounds = config.customSounds || config.sound.customSounds
  config = JSON.parse(JSON.stringify(found.config))
  config.presets = preservedPresets
  if (preservedCustomSounds) {
    config.customSounds = preservedCustomSounds
    config.sound.customSounds = preservedCustomSounds
  }
  if (found.timers && found.timers.length > 0) {
    timers = JSON.parse(JSON.stringify(found.timers))
    if (timers[0]) {
      activeTimerId = timers[0].id
    }
  }
  broadcast()
}

function deletePreset(id: string) {
  if (!config.presets) return
  config.presets = config.presets.filter(p => p.id !== id)
  broadcast()
}

function addCustomSound(name: string, dataUrl: string) {
  if (!name || !dataUrl) return
  if (!config.customSounds) config.customSounds = []
  if (!config.sound.customSounds) config.sound.customSounds = []
  const newSound: CustomSound = {
    id: `sound-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    dataUrl
  }
  config.customSounds.push(newSound)
  config.sound.customSounds.push(newSound)
  broadcast()
}

function deleteCustomSound(id: string) {
  if (config.customSounds) {
    config.customSounds = config.customSounds.filter(s => s.id !== id)
  }
  if (config.sound.customSounds) {
    config.sound.customSounds = config.sound.customSounds.filter(s => s.id !== id)
  }
  broadcast()
}

function addRule(rule: AlertRule) {
  if (!rule || !rule.id) return
  config.rules.push(rule)
  broadcast()
}

function updateRule(rule: AlertRule) {
  const idx = config.rules.findIndex(r => r.id === rule.id)
  if (idx !== -1) {
    config.rules[idx] = { ...config.rules[idx], ...rule }
    broadcast()
  }
}

function deleteRule(id: string) {
  config.rules = config.rules.filter(r => r.id !== id)
  broadcast()
}

const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    message: 'Forever Timer Backend is running',
    state: getTimerState()
  }))
  .ws('/ws', {
    open(ws) {
      clients.add(ws)
      ws.send(JSON.stringify(getTimerState()))
    },
    message(ws, raw) {
      let data: any
      try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch (err) {
        console.error('Invalid JSON received:', raw)
        return
      }

      if (!data || typeof data !== 'object') return

      switch (data.type) {
        case 'START':
          startTimer()
          break
        case 'PAUSE':
          pauseTimer()
          break
        case 'TOGGLE_PLAY':
          togglePlay()
          break
        case 'RESET':
          resetTimer()
          break
        case 'SET_TIME':
          if (typeof data.seconds === 'number') {
            setTime(data.seconds)
          }
          break
        case 'SET_DURATION':
          if (typeof data.seconds === 'number') {
            setDuration(data.seconds)
          }
          break
        case 'SET_SPEAKER':
          if (typeof data.name === 'string') {
            setSpeaker(data.name)
          }
          break
        case 'SET_TITLE':
          if (typeof data.title === 'string') {
            setTitle(data.title)
          }
          break
        case 'SELECT_TIMER':
          if (typeof data.id === 'string') {
            selectTimer(data.id)
          }
          break
        case 'NEXT_TIMER':
          nextTimer()
          break
        case 'PREV_TIMER':
          prevTimer()
          break
        case 'ADD_TIMER':
          addTimer(data)
          break
        case 'UPDATE_TIMER':
          if (typeof data.id === 'string') {
            updateTimer(data)
          }
          break
        case 'DELETE_TIMER':
          if (typeof data.id === 'string') {
            deleteTimer(data.id)
          }
          break
        case 'UPDATE_CONFIG':
          if (data.config && typeof data.config === 'object') {
            updateConfig(data.config)
          }
          break
        case 'SAVE_PRESET':
          if (typeof data.name === 'string') {
            savePreset(data.name)
          }
          break
        case 'LOAD_PRESET':
          if (typeof data.id === 'string') {
            loadPreset(data.id)
          }
          break
        case 'DELETE_PRESET':
          if (typeof data.id === 'string') {
            deletePreset(data.id)
          }
          break
        case 'ADD_CUSTOM_SOUND':
          if (typeof data.name === 'string' && typeof data.dataUrl === 'string') {
            addCustomSound(data.name, data.dataUrl)
          }
          break
        case 'DELETE_CUSTOM_SOUND':
          if (typeof data.id === 'string') {
            deleteCustomSound(data.id)
          }
          break
        case 'ADD_RULE':
          if (data.rule && typeof data.rule === 'object') {
            addRule(data.rule)
          }
          break
        case 'UPDATE_RULE':
          if (data.rule && typeof data.rule === 'object') {
            updateRule(data.rule)
          }
          break
        case 'DELETE_RULE':
          if (typeof data.id === 'string') {
            deleteRule(data.id)
          }
          break
        default:
          console.warn('Unknown event type:', data.type)
      }
    },
    close(ws) {
      clients.delete(ws)
    }
  })
  .listen(8080)

console.log(`Forever Timer Backend running at http://localhost:8080 (WS: ws://localhost:8080/ws)`)
