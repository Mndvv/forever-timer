import { computed, onMounted, onUnmounted } from 'vue'

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface AlertRule {
  id: string
  name: string
  triggerAt: number       // in seconds remaining (can be negative for overtime)
  textColor?: string
  bgColor?: string
  flash?: boolean
  sound?: string          // 'chime' | 'bell' | 'beep' | 'tick' | 'buzz' | 'none' or custom url/name/id
  soundEverySecond?: boolean // play sound on every second tick while rule is active
}

export interface CustomSound {
  id: string
  name: string
  dataUrl: string
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
  countOvertime: boolean
  customSounds?: CustomSound[]
  presets?: TimerPreset[]
}

export interface TimerItem {
  id: string
  title: string
  speakerName: string
  duration: number       // total duration in seconds
  timeRemaining: number  // in seconds (can be negative in overtime)
}

export interface TimerMessage {
  type: string
  activeTimerId?: string
  timeRemaining?: number
  duration?: number
  status?: TimerStatus
  speakerName?: string
  title?: string
  timers?: TimerItem[]
  seconds?: number
  name?: string
  config?: Partial<TimerConfig>
}

export const defaultTimerConfig: TimerConfig = {
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
      sound: 'none'
    },
    {
      id: 'rule-danger',
      name: 'Danger (10s)',
      triggerAt: 10,
      textColor: '#fb923c',
      bgColor: 'transparent',
      flash: false,
      sound: 'tick'
    },
    {
      id: 'rule-urgent',
      name: 'Urgent (5s)',
      triggerAt: 5,
      textColor: '#ef4444',
      bgColor: 'transparent',
      flash: true,
      sound: 'tick'
    },
    {
      id: 'rule-end',
      name: 'Time Up (0s)',
      triggerAt: 0,
      textColor: '#ef4444',
      bgColor: 'transparent',
      flash: true,
      sound: 'end'
    },
    {
      id: 'rule-overtime',
      name: 'Overtime (-30s)',
      triggerAt: -30,
      textColor: '#dc2626',
      bgColor: 'transparent',
      flash: true,
      sound: 'bell'
    }
  ],
  sound: {
    enableChimes: true,
    startSound: 'chime',
    endSound: 'bell',
    tickSound: 'tick',
    tickUnderXSeconds: 5,
    volume: 0.8
  },
  countOvertime: true
}

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function useTimerSocket() {
  const runtimeConfig = useRuntimeConfig()

  const timeRemaining = useState<number>('timer_timeRemaining', () => 0)
  const duration = useState<number>('timer_duration', () => 300)
  const status = useState<TimerStatus>('timer_status', () => 'idle')
  const speakerName = useState<string>('timer_speakerName', () => '')
  const title = useState<string>('timer_title', () => '')
  const activeTimerId = useState<string>('timer_activeTimerId', () => '')
  const timers = useState<TimerItem[]>('timer_timers', () => [])
  const isConnected = useState<boolean>('timer_isConnected', () => false)
  const config = useState<TimerConfig>('timer_config', () => ({ ...defaultTimerConfig }))

  // Main countdown clock: strictly stops displaying at 00:00 when overtime kicks in
  const formattedTime = computed(() => {
    if (timeRemaining.value <= 0) {
      return '00:00'
    }
    const mins = Math.floor(timeRemaining.value / 60)
    const secs = timeRemaining.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  // Overtime detection and formatting
  const isOvertime = computed(() => {
    return timeRemaining.value < 0
  })

  const formattedOvertime = computed(() => {
    if (timeRemaining.value >= 0) return ''
    const abs = Math.abs(timeRemaining.value)
    const mins = Math.floor(abs / 60)
    const secs = abs % 60
    return `-${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  const formattedDuration = computed(() => {
    const total = Math.max(0, duration.value)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  // Dynamic Rule matching (most critical / lowest triggerAt matches first)
  const activeRule = computed<AlertRule | null>(() => {
    if (!config.value.rules || !config.value.rules.length) return null
    // Sort rules by triggerAt ascending (-30, 0, 5, 10, 30...)
    const sorted = [...config.value.rules].sort((a, b) => a.triggerAt - b.triggerAt)
    for (const rule of sorted) {
      if (timeRemaining.value <= rule.triggerAt) {
        return rule
      }
    }
    return null
  })

  function getWsUrl(): string {
    if (runtimeConfig.public.wsUrl) {
      return runtimeConfig.public.wsUrl as string
    }
    if (import.meta.client) {
      const host = window.location.hostname || 'localhost'
      return `ws://${host}:8080/ws`
    }
    return 'ws://localhost:8080/ws'
  }

  function send(data: object) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    } else {
      console.warn('Cannot send message: WebSocket is not open', data)
    }
  }

  function start() {
    send({ type: 'START' })
  }

  function pause() {
    send({ type: 'PAUSE' })
  }

  function togglePlay() {
    send({ type: 'TOGGLE_PLAY' })
  }

  function reset() {
    send({ type: 'RESET' })
  }

  function setTime(seconds: number) {
    send({ type: 'SET_TIME', seconds })
  }

  function setDuration(seconds: number) {
    send({ type: 'SET_DURATION', seconds })
  }

  function setSpeaker(name: string) {
    send({ type: 'SET_SPEAKER', name })
  }

  function setTitle(newTitle: string) {
    send({ type: 'SET_TITLE', title: newTitle })
  }

  function selectTimer(id: string) {
    send({ type: 'SELECT_TIMER', id })
  }

  function nextTimer() {
    send({ type: 'NEXT_TIMER' })
  }

  function prevTimer() {
    send({ type: 'PREV_TIMER' })
  }

  function addTimer(data: { title?: string; speakerName?: string; duration?: number }) {
    send({ type: 'ADD_TIMER', ...data })
  }

  function updateTimer(data: { id: string; title?: string; speakerName?: string; duration?: number; timeRemaining?: number }) {
    send({ type: 'UPDATE_TIMER', ...data })
  }

  function deleteTimer(id: string) {
    send({ type: 'DELETE_TIMER', id })
  }

  function setTimers(newTimers: TimerItem[]) {
    send({ type: 'SET_TIMERS', timers: newTimers })
  }

  function updateConfig(newConfig: Partial<TimerConfig>) {
    send({ type: 'UPDATE_CONFIG', config: newConfig })
  }

  function savePreset(name: string) {
    send({ type: 'SAVE_PRESET', name })
  }

  function loadPreset(id: string) {
    send({ type: 'LOAD_PRESET', id })
  }

  function deletePreset(id: string) {
    send({ type: 'DELETE_PRESET', id })
  }

  function addCustomSound(name: string, dataUrl: string) {
    send({ type: 'ADD_CUSTOM_SOUND', name, dataUrl })
  }

  function deleteCustomSound(id: string) {
    send({ type: 'DELETE_CUSTOM_SOUND', id })
  }

  function addRule(rule: AlertRule) {
    send({ type: 'ADD_RULE', rule })
  }

  function updateRule(rule: AlertRule) {
    send({ type: 'UPDATE_RULE', rule })
  }

  function deleteRule(id: string) {
    send({ type: 'DELETE_RULE', id })
  }

  function connect() {
    if (import.meta.server) return

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    try {
      const url = getWsUrl()
      socket = new WebSocket(url)

      socket.onopen = () => {
        isConnected.value = true
        console.log('Connected to Timer WebSocket:', url)
      }

      socket.onmessage = (event) => {
        try {
          const data: TimerMessage = JSON.parse(event.data)
          if (data.type === 'TICK') {
            if (typeof data.timeRemaining === 'number') {
              timeRemaining.value = data.timeRemaining
            }
            if (typeof data.duration === 'number') {
              duration.value = data.duration
            }
            if (data.status) {
              status.value = data.status
            }
            if (typeof data.speakerName === 'string') {
              speakerName.value = data.speakerName
            }
            if (typeof data.title === 'string') {
              title.value = data.title
            }
            if (typeof data.activeTimerId === 'string') {
              activeTimerId.value = data.activeTimerId
            }
            if (Array.isArray(data.timers)) {
              timers.value = data.timers
            }
            if (data.config && typeof data.config === 'object') {
              config.value = {
                appearance: { ...config.value.appearance, ...data.config.appearance },
                rules: Array.isArray(data.config.rules) ? data.config.rules : config.value.rules,
                sound: { ...config.value.sound, ...data.config.sound },
                countOvertime: typeof data.config.countOvertime === 'boolean' ? data.config.countOvertime : config.value.countOvertime,
                customSounds: Array.isArray(data.config.customSounds) ? data.config.customSounds : (config.value.customSounds || []),
                presets: Array.isArray(data.config.presets) ? data.config.presets : (config.value.presets || [])
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      socket.onclose = () => {
        isConnected.value = false
        socket = null
        scheduleReconnect()
      }

      socket.onerror = (err) => {
        console.error('WebSocket error:', err)
        socket?.close()
      }
    } catch (err) {
      console.error('Error creating WebSocket connection:', err)
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer || import.meta.server) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, 2000)
  }

  // Global Keyboard Shortcuts handler
  function setupKeyboardShortcuts() {
    if (import.meta.server) return

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        reset()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextTimer()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        prevTimer()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', onKeyDown)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeyDown)
    })
  }

  return {
    timeRemaining,
    duration,
    status,
    speakerName,
    title,
    activeTimerId,
    timers,
    isConnected,
    config,
    timerConfig: config,
    formattedTime,
    isOvertime,
    formattedOvertime,
    formattedDuration,
    activeRule,
    connect,
    start,
    pause,
    togglePlay,
    reset,
    setTime,
    setDuration,
    setSpeaker,
    setTitle,
    selectTimer,
    nextTimer,
    prevTimer,
    addTimer,
    updateTimer,
    deleteTimer,
    setTimers,
    updateConfig,
    savePreset,
    loadPreset,
    deletePreset,
    addCustomSound,
    deleteCustomSound,
    addRule,
    updateRule,
    deleteRule,
    setupKeyboardShortcuts
  }
}
