<template>
  <div
    class="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center select-none overflow-hidden p-8 transition-colors duration-500"
    :style="containerStyle"
    @click="unlockAudio"
  >
    <!-- Topic / Round Title -->
    <div
      v-if="title"
      class="text-xl md:text-2xl font-bold tracking-widest uppercase text-zinc-300/80 mb-1 text-center max-w-[90vw] truncate"
      :style="textShadowStyle"
    >
      {{ title }}
    </div>

    <!-- Speaker Name / Role -->
    <div
      v-if="speakerName"
      class="text-3xl md:text-5xl font-extrabold tracking-wide uppercase px-6 py-2 rounded-xl mb-3 transition-all duration-300 max-w-[90vw] truncate text-center"
      :style="[speakerTextStyle, textShadowStyle]"
    >
      {{ speakerName }}
    </div>

    <!-- Main Countdown Display (Strictly stops at 00:00 when overtime kicks in) -->
    <div
      class="font-extrabold tracking-tight tabular-nums transition-all duration-300 text-8xl md:text-9xl xl:text-[14rem] leading-none"
      :class="[flashClass]"
      :style="[timerTextStyle, mainTimerShadowStyle]"
    >
      {{ formattedTime }}
    </div>

    <!-- Customizable Overtime Display Underneath Main Countdown -->
    <div
      v-if="isOvertime"
      class="mt-4 flex items-center gap-3 px-5 py-2 rounded-2xl transition-all duration-300"
      :class="overtimeContainerClasses"
      :style="overtimeContainerStyle"
    >
      <!-- Optional Overtime Label Badge (Can be disabled or customized) -->
      <span
        v-if="config.appearance.overtimeLabel"
        class="text-xs sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md"
        :style="overtimeBadgeStyle"
      >
        {{ config.appearance.overtimeLabel }}
      </span>

      <!-- Negative Overtime Number (-MM:SS) -->
      <span
        class="font-mono text-3xl sm:text-5xl font-black tracking-tight tabular-nums"
        :style="overtimeTextStyle"
      >
        {{ formattedOvertime }}
      </span>
    </div>

    <!-- Status badge when paused -->
    <div
      v-if="status === 'paused' && !isOvertime"
      class="mt-6 px-5 py-1.5 rounded-full text-lg font-bold uppercase tracking-widest bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-lg backdrop-blur-sm"
    >
      PAUSED
    </div>

    <!-- Audio permission helper for standard browsers -->
    <div
      v-if="audioNeedsInteraction"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs bg-zinc-900/90 text-zinc-300 border border-zinc-700 px-4 py-2 rounded-full cursor-pointer hover:bg-zinc-800 transition-colors shadow-lg flex items-center gap-2"
      @click.stop="unlockAudio"
    >
      <span>🔊</span>
      <span>Click anywhere to enable audio & spacebar controls</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { playCustomSound, getAudioContext } from '../utils/soundEngine'

const {
  timeRemaining,
  status,
  speakerName,
  title,
  config,
  formattedTime,
  isOvertime,
  formattedOvertime,
  activeRule,
  connect,
  setupKeyboardShortcuts
} = useTimerSocket()

// Register global Spacebar / Key shortcuts
setupKeyboardShortcuts()

const prevStatus = ref(status.value)
const prevTime = ref(timeRemaining.value)
const audioNeedsInteraction = ref(false)

function unlockAudio() {
  audioNeedsInteraction.value = false
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

// Watch status transitions for start chime
watch(status, (newStatus, oldStatus) => {
  const customSoundsList = config.value.customSounds || config.value.sound?.customSounds || []
  if (
    config.value.sound.enableChimes &&
    (oldStatus === 'idle' || oldStatus === 'paused') &&
    newStatus === 'running'
  ) {
    playCustomSound(config.value.sound.startSound, config.value.sound.volume, customSoundsList)
  }
  prevStatus.value = newStatus
})

// Watch time remaining for customizable rules & ticks
watch(timeRemaining, (newTime) => {
  const oldTime = prevTime.value
  prevTime.value = newTime

  if (!config.value.sound.enableChimes || status.value !== 'running') return

  const customSoundsList = config.value.customSounds || config.value.sound?.customSounds || []

  // 1. Check if an active rule specifies soundEverySecond OR uses 'tick' sound (tick = repeat every second)
  if (activeRule.value && activeRule.value.sound && activeRule.value.sound !== 'none') {
    const isTickSound = activeRule.value.sound === 'tick' || activeRule.value.sound === config.value.sound.tickSound
    if (activeRule.value.soundEverySecond || isTickSound) {
      playCustomSound(activeRule.value.sound, config.value.sound.volume, customSoundsList)
    }
  }

  // 2. Check if any alert rule was newly triggered on this second tick (one-shot on crossing)
  if (config.value.rules && Array.isArray(config.value.rules)) {
    for (const rule of config.value.rules) {
      if (oldTime > rule.triggerAt && newTime <= rule.triggerAt) {
        const isTickSound = rule.sound === 'tick' || rule.sound === config.value.sound.tickSound
        // Only play one-shot if NOT a repeating tick sound (those are handled in step 1 every second)
        if (rule.sound && rule.sound !== 'none' && !rule.soundEverySecond && !isTickSound) {
          playCustomSound(rule.sound, config.value.sound.volume, customSoundsList)
        }
      }
    }
  }

  // 3. Default end sound when hitting 0
  if (newTime === 0 && oldTime > 0) {
    if (config.value.sound.endSound && config.value.sound.endSound !== 'none') {
      playCustomSound(config.value.sound.endSound, config.value.sound.volume, customSoundsList)
    }
    return
  }

  // 4. Tick sound countdown (global tickUnderXSeconds range, no active rule overriding)
  if (
    newTime < oldTime &&
    newTime > 0 &&
    newTime <= config.value.sound.tickUnderXSeconds &&
    (!activeRule.value || (!activeRule.value.soundEverySecond && activeRule.value.sound !== 'tick' && activeRule.value.sound !== config.value.sound.tickSound))
  ) {
    if (config.value.sound.tickSound && config.value.sound.tickSound !== 'none') {
      playCustomSound(config.value.sound.tickSound, config.value.sound.volume, customSoundsList)
    }
  }
})

// Container styles based on user's active custom rule and background color
const containerStyle = computed(() => {
  const appearance = config.value.appearance
  let bg = appearance.defaultBgColor || 'transparent'

  if (activeRule.value?.bgColor && activeRule.value.bgColor !== 'transparent') {
    bg = activeRule.value.bgColor
  }

  return {
    backgroundColor: bg,
    fontFamily: appearance.fontFamily || 'monospace'
  }
})

// Main timer shadow transparency
const mainTimerShadowStyle = computed(() => {
  const opacity = config.value.appearance.textShadowOpacity ?? 0.8
  if (opacity <= 0) return { filter: 'none' }
  return {
    filter: `drop-shadow(0 8px 24px rgba(0,0,0,${opacity}))`
  }
})

// General text shadow style
const textShadowStyle = computed(() => {
  const opacity = config.value.appearance.textShadowOpacity ?? 0.8
  if (opacity <= 0) return { filter: 'none' }
  return {
    filter: `drop-shadow(0 4px 12px rgba(0,0,0,${opacity}))`
  }
})

// Main timer text color based on user's active custom rule
const timerTextStyle = computed(() => {
  const appearance = config.value.appearance
  let color = appearance.defaultTextColor || '#34d399'

  if (activeRule.value?.textColor) {
    color = activeRule.value.textColor
  }

  return { color }
})

// Speaker name text color
const speakerTextStyle = computed(() => {
  if (activeRule.value?.textColor) {
    return { color: activeRule.value.textColor }
  }
  return { color: '#ffffff' }
})

// Flashing effect governed by active custom rule
const flashClass = computed(() => {
  if (activeRule.value?.flash && status.value === 'running') {
    return 'animate-pulse'
  }
  return ''
})

// Customizable Overtime Container Styling
const overtimeContainerClasses = computed(() => {
  const classes: string[] = []
  if (config.value.appearance.animateOvertime) {
    classes.push('animate-pulse')
  }
  if (config.value.appearance.showOvertimeBorder) {
    classes.push('border border-red-700/60')
  }
  return classes.join(' ')
})

const overtimeContainerStyle = computed(() => {
  const appearance = config.value.appearance
  const opacity = appearance.textShadowOpacity ?? 0.8

  const bg = appearance.showOvertimeBg
    ? (appearance.overtimeBgColor || 'rgba(69, 10, 10, 0.8)')
    : 'transparent'

  const shadow = appearance.showOvertimeShadow && opacity > 0
    ? `0 10px 25px -5px rgba(0, 0, 0, ${opacity})`
    : 'none'

  return {
    backgroundColor: bg,
    boxShadow: shadow
  }
})

const overtimeBadgeStyle = computed(() => {
  const appearance = config.value.appearance
  if (appearance.showOvertimeBg) {
    return {
      backgroundColor: '#dc2626',
      color: '#ffffff'
    }
  }
  return {
    backgroundColor: 'transparent',
    color: appearance.overtimeTextColor || '#f87171',
    border: '1px solid currentColor'
  }
})

const overtimeTextStyle = computed(() => {
  const appearance = config.value.appearance
  const opacity = appearance.textShadowOpacity ?? 0.8
  return {
    color: appearance.overtimeTextColor || '#f87171',
    filter: opacity > 0 ? `drop-shadow(0 4px 12px rgba(0,0,0,${opacity}))` : 'none'
  }
})

onMounted(() => {
  connect()
  // Ensure overlay doesn't lock body overflow globally when navigating
  if (typeof document !== 'undefined') {
    document.body.classList.add('obs-overlay-body')
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('obs-overlay-body')
  }
})

useHead({
  title: 'OBS Debate Timer Overlay'
})
</script>

<style>
.obs-overlay-body {
  background-color: transparent !important;
  overflow: hidden !important;
  margin: 0 !important;
}
</style>
