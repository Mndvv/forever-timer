<template>
  <div class="min-h-screen lg:h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden lg:overflow-hidden">
    
    <!-- Top Global Header -->
    <header class="border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 shrink-0">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <span class="text-base">⏱️</span>
          </div>
          <div>
            <h1 class="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Forever Timer <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hidden sm:inline">Stagetimer Pro</span>
            </h1>
          </div>
        </div>

        <!-- Mobile Navigation Tabs (ONLY on mobile/tablet, single source of navigation) -->
        <div class="flex lg:hidden bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-semibold shadow-inner">
          <button
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="activeTab === 'stage' ? 'bg-zinc-800 text-emerald-400 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'"
            @click="setTab('stage')"
          >
            Stage
          </button>
          <button
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="activeTab === 'rundown' ? 'bg-zinc-800 text-emerald-400 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'"
            @click="setTab('rundown')"
          >
            Timers ({{ timers.length }})
          </button>
          <button
            class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="activeTab === 'settings' ? 'bg-zinc-800 text-emerald-400 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'"
            @click="setTab('settings')"
          >
            Settings
          </button>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Spacebar hint pill on desktop -->
          <span class="hidden xl:inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 font-mono text-[10px]">Space</kbd> Play/Pause
          </span>

          <!-- OBS Overlay Link -->
          <a
            href="/overlay"
            target="_blank"
            class="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
            title="Open OBS Overlay in new tab"
          >
            <span>📺</span>
            <span class="hidden sm:inline">Overlay</span>
          </a>

          <!-- Connection Badge -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
            :class="isConnected ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'"
          >
            <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'" />
            <span class="hidden md:inline">{{ isConnected ? 'Connected' : 'Connecting' }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 lg:overflow-hidden flex flex-col min-h-0">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 lg:h-full lg:overflow-hidden min-h-0">
        
        <!-- LEFT: Active Stage Timer Display & Controls (col-span-7 or 8) -->
        <section
          class="space-y-5 lg:col-span-7 xl:col-span-8 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2"
          :class="{ 'hidden lg:block': activeTab !== 'stage' }"
        >
          <!-- Active Timer Card -->
          <div class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            
            <!-- Active Context Banner -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  Active Stage
                </span>
                <span class="text-xs text-zinc-500 font-mono">
                  #{{ activeTimerIndex + 1 }} of {{ timers.length }}
                </span>
              </div>

              <!-- Prev / Next Steppers -->
              <div class="flex items-center gap-1 text-xs">
                <button
                  class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  :disabled="activeTimerIndex <= 0"
                  title="Previous Timer (Left Arrow)"
                  @click="prevTimer"
                >
                  ⏮ Prev
                </button>
                <button
                  class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  :disabled="activeTimerIndex >= timers.length - 1"
                  title="Next Timer (Right Arrow)"
                  @click="nextTimer"
                >
                  Next ⏭
                </button>
              </div>
            </div>

            <!-- Active Title & Speaker Displays -->
            <div class="flex flex-col items-center justify-center text-center space-y-0.5 mb-1">
              <div class="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-widest truncate max-w-full">
                {{ title || 'Untitled Stage Timer' }}
              </div>
              <div
                v-if="speakerName"
                class="text-base sm:text-xl font-bold uppercase tracking-wide truncate max-w-full"
                :style="timerTextStyle"
              >
                {{ speakerName }}
              </div>
            </div>

            <!-- Big Digits Display (Stays strictly at 00:00 during Overtime) -->
            <div class="flex flex-col items-center justify-center py-2 sm:py-3">
              <div
                class="font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tight tabular-nums select-none leading-none transition-colors duration-200"
                :class="[flashClass]"
                :style="[timerTextStyle, mainTimerShadowStyle]"
              >
                {{ formattedTime }}
              </div>

              <!-- Overtime Indicator Underneath Main Counter -->
              <div
                v-if="isOvertime"
                class="mt-2.5 flex items-center gap-2.5 px-4 py-1.5 rounded-2xl transition-all"
                :class="[
                  localConfig.appearance.animateOvertime ? 'animate-pulse' : '',
                  localConfig.appearance.showOvertimeBorder ? 'border border-red-700/60' : ''
                ]"
                :style="{
                  backgroundColor: localConfig.appearance.showOvertimeBg ? (localConfig.appearance.overtimeBgColor || 'rgba(69, 10, 10, 0.8)') : 'transparent',
                  boxShadow: localConfig.appearance.showOvertimeShadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : 'none'
                }"
              >
                <span
                  v-if="localConfig.appearance.overtimeLabel"
                  class="text-[10px] sm:text-xs uppercase font-black px-2 py-0.5 rounded"
                  :style="{
                    backgroundColor: localConfig.appearance.showOvertimeBg ? '#dc2626' : 'transparent',
                    color: localConfig.appearance.overtimeTextColor || '#f87171',
                    border: localConfig.appearance.showOvertimeBg ? 'none' : '1px solid currentColor'
                  }"
                >
                  {{ localConfig.appearance.overtimeLabel }}
                </span>
                <span
                  class="text-xl sm:text-3xl font-black tracking-tight font-mono tabular-nums"
                  :style="{ color: localConfig.appearance.overtimeTextColor || '#f87171' }"
                >
                  {{ formattedOvertime }}
                </span>
              </div>

              <!-- Status Badge & Target Reference -->
              <div class="mt-3 flex items-center gap-2.5 flex-wrap justify-center">
                <span
                  class="text-xs font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm"
                  :class="{
                    'bg-emerald-950 text-emerald-400 border border-emerald-800': status === 'running',
                    'bg-yellow-950 text-yellow-400 border border-yellow-800': status === 'paused',
                    'bg-zinc-800 text-zinc-400 border border-zinc-700': status === 'idle'
                  }"
                >
                  {{ status }}
                </span>
                <span class="text-xs text-zinc-400 font-mono">
                  Target: {{ formattedDuration }} ({{ duration }}s)
                </span>
                <span v-if="activeRule" class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  Rule: {{ activeRule.name }}
                </span>
              </div>
            </div>

            <!-- Draggable Scrubber strictly bounded by duration [0, duration] -->
            <div class="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5">
              <div class="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
                <span>00:00</span>
                <span class="text-zinc-500 font-sans text-[11px]">
                  Scrubber: {{ formattedTime }} / {{ formattedDuration }}
                </span>
                <span>{{ formattedDuration }}</span>
              </div>

              <!-- Native range slider strictly clamped between 0 and duration -->
              <input
                v-model.number="scrubberValue"
                type="range"
                min="0"
                :max="duration"
                step="1"
                class="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                @input="onScrubberInput"
                @change="onScrubberChange"
              />

              <!-- Micro delta adjustments -->
              <div class="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
                <button
                  class="px-2 py-1 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 cursor-pointer"
                  @click="adjustSeconds(-60)"
                >
                  -1m
                </button>
                <button
                  class="px-2 py-1 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 cursor-pointer"
                  @click="adjustSeconds(-10)"
                >
                  -10s
                </button>
                <button
                  class="px-2 py-1 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 cursor-pointer"
                  @click="adjustSeconds(10)"
                >
                  +10s
                </button>
                <button
                  class="px-2 py-1 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 cursor-pointer"
                  @click="adjustSeconds(60)"
                >
                  +1m
                </button>
              </div>
            </div>

            <!-- Primary Large Action Controls (Start/Pause, Reset, Next) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
              <button
                class="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-2xl text-sm sm:text-base tracking-wide uppercase transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                @click="togglePlay"
              >
                <span class="text-base">{{ status === 'running' ? '⏸' : '▶' }}</span>
                <span>{{ status === 'running' ? 'Pause' : (status === 'paused' ? 'Resume' : 'Start') }}</span>
              </button>

              <button
                class="py-3.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-2xl text-sm sm:text-base tracking-wide uppercase transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                :disabled="status !== 'running'"
                @click="pause"
              >
                <span class="text-base">⏸</span>
                <span>Pause</span>
              </button>

              <button
                class="py-3.5 px-3 bg-zinc-800 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-300 border border-zinc-700 hover:border-rose-800/80 font-bold rounded-2xl text-sm sm:text-base tracking-wide uppercase transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                @click="reset"
              >
                <span class="text-base">↺</span>
                <span>Reset</span>
              </button>

              <button
                class="py-3.5 px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 border border-zinc-700 font-bold rounded-2xl text-sm sm:text-base tracking-wide uppercase transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                :disabled="activeTimerIndex >= timers.length - 1"
                @click="nextTimer"
              >
                <span class="text-base">⏭</span>
                <span>Next</span>
              </button>
            </div>

            <!-- Manual Duration Input & Presets -->
            <div class="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Manual Duration Input -->
              <div class="space-y-1.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  ⌨️ Set Duration Manually
                </label>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                    <input
                      v-model.number="manualMins"
                      type="number"
                      min="0"
                      max="120"
                      class="w-10 bg-transparent text-center text-xs font-mono text-zinc-100 focus:outline-none"
                      placeholder="MM"
                    />
                    <span class="text-zinc-500 font-bold">:</span>
                    <input
                      v-model.number="manualSecs"
                      type="number"
                      min="0"
                      max="59"
                      class="w-10 bg-transparent text-center text-xs font-mono text-zinc-100 focus:outline-none"
                      placeholder="SS"
                    />
                  </div>
                  <button
                    class="px-3 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer flex-1"
                    @click="applyManualDuration"
                  >
                    Apply Duration
                  </button>
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="space-y-1.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  ⚡ Quick Presets
                </label>
                <div class="grid grid-cols-4 gap-1.5">
                  <button
                    class="py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/60 cursor-pointer"
                    @click="quickSetDuration(120)"
                  >
                    2 Min
                  </button>
                  <button
                    class="py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/60 cursor-pointer"
                    @click="quickSetDuration(180)"
                  >
                    3 Min
                  </button>
                  <button
                    class="py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/60 cursor-pointer"
                    @click="quickSetDuration(300)"
                  >
                    5 Min
                  </button>
                  <button
                    class="py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/60 cursor-pointer"
                    @click="quickSetDuration(420)"
                  >
                    7 Min
                  </button>
                </div>
              </div>
            </div>

            <!-- Active Speaker & Title Quick Inputs -->
            <div class="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] text-zinc-400 font-semibold mb-1">Debate Topic / Title</label>
                <div class="flex gap-1.5">
                  <input
                    v-model="localTitle"
                    type="text"
                    placeholder="e.g. Opening Remarks"
                    class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    @keyup.enter="updateActiveTitle"
                  />
                  <button
                    class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
                    @click="updateActiveTitle"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] text-zinc-400 font-semibold mb-1">Speaker Name</label>
                <div class="flex gap-1.5">
                  <input
                    v-model="localSpeaker"
                    type="text"
                    placeholder="e.g. 1st Affirmative"
                    class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    @keyup.enter="updateActiveSpeaker"
                  />
                  <button
                    class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
                    @click="updateActiveSpeaker"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- RIGHT: Multi-Timer Rundown & Settings (col-span-5 or 4) -->
        <section
          class="lg:col-span-5 xl:col-span-4 flex flex-col lg:h-full lg:overflow-hidden min-h-0 space-y-3"
          :class="{ 'hidden lg:flex': activeTab === 'stage' }"
        >
          <!-- Desktop Tabs Header (Only visible on Desktop) -->
          <div class="hidden lg:flex bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 gap-1 text-xs font-bold shrink-0">
            <button
              class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="desktopSideTab === 'rundown' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
              @click="setDesktopSideTab('rundown')"
            >
              <span>📋</span>
              <span>Rundown ({{ timers.length }})</span>
            </button>
            <button
              class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="desktopSideTab === 'settings' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
              @click="setDesktopSideTab('settings')"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>

          <!-- Independent Scrollable Content Container -->
          <div class="flex-1 overflow-y-auto custom-scrollbar pr-0 lg:pr-1 space-y-4 min-h-0">
            
            <!-- PANEL 1: RUNDOWN / AGENDA LIST -->
            <div
              v-if="shouldShowRundown"
              class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <!-- Add Timer Button & Collapsible Inline Form -->
              <div class="border-b border-zinc-800 pb-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <span>⏱️</span> Timers in Event
                  </h3>
                  <button
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    @click="showAddTimerForm = !showAddTimerForm"
                  >
                    <span>{{ showAddTimerForm ? '✕ Close' : '+ Add Timer' }}</span>
                  </button>
                </div>

                <!-- New Timer Inline Form -->
                <div
                  v-if="showAddTimerForm"
                  class="mt-3 p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3 animate-fadeIn"
                >
                  <div class="text-xs font-bold text-emerald-400">Add New Timer to Rundown</div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-0.5">Title / Topic</label>
                    <input
                      v-model="newTimerTitle"
                      type="text"
                      placeholder="e.g. Closing Argument"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-0.5">Speaker Name</label>
                    <input
                      v-model="newTimerSpeaker"
                      type="text"
                      placeholder="e.g. 2nd Affirmative"
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-0.5">Duration (MM : SS)</label>
                    <div class="flex items-center gap-2">
                      <div class="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                        <input
                          v-model.number="newTimerMins"
                          type="number"
                          min="0"
                          max="120"
                          class="w-10 bg-transparent text-center text-xs font-mono text-zinc-100"
                          placeholder="05"
                        />
                        <span class="text-zinc-500">:</span>
                        <input
                          v-model.number="newTimerSecs"
                          type="number"
                          min="0"
                          max="59"
                          class="w-10 bg-transparent text-center text-xs font-mono text-zinc-100"
                          placeholder="00"
                        />
                      </div>
                      <button
                        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex-1 cursor-pointer"
                        @click="submitNewTimer"
                      >
                        Save Timer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timers Rundown List -->
              <div class="space-y-2.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                <div
                  v-for="(t, index) in timers"
                  :key="t.id"
                  class="group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3"
                  :class="t.id === activeTimerId ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30' : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'"
                  @click="selectTimer(t.id)"
                >
                  <!-- Left: Number & Text -->
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      :class="t.id === activeTimerId ? 'bg-emerald-500 text-zinc-950 shadow-sm' : 'bg-zinc-800 text-zinc-400'"
                    >
                      {{ index + 1 }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-xs text-zinc-200 truncate group-hover:text-emerald-300 transition-colors">
                        {{ t.title || 'Untitled' }}
                      </div>
                      <div class="text-[11px] text-zinc-400 truncate">
                        {{ t.speakerName || 'No speaker assigned' }}
                      </div>
                    </div>
                  </div>

                  <!-- Right: Time & Delete -->
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="text-right font-mono">
                      <div
                        class="text-xs font-black tracking-tight"
                        :class="t.timeRemaining < 0 ? 'text-red-400' : (t.id === activeTimerId ? 'text-emerald-400' : 'text-zinc-300')"
                      >
                        {{ t.timeRemaining < 0 ? '-' + formatSeconds(Math.abs(t.timeRemaining)) : formatSeconds(t.timeRemaining) }}
                      </div>
                      <div class="text-[10px] text-zinc-500">
                        / {{ formatSeconds(t.duration) }}
                      </div>
                    </div>

                    <button
                      v-if="timers.length > 1"
                      class="w-7 h-7 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 flex items-center justify-center text-xs opacity-40 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete timer"
                      @click.stop="deleteTimer(t.id)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <!-- Single OBS Output Helper -->
              <div class="pt-3 border-t border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Single OBS Source:</span>
                  <button
                    class="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                    @click="copyOverlayUrl"
                  >
                    {{ copied ? '✓ Copied!' : 'Copy Link' }}
                  </button>
                </div>
                <p class="text-[11px] text-zinc-500">
                  Any timer clicked above instantly updates your single OBS overlay screen.
                </p>
              </div>
            </div>

            <!-- PANEL 2: SETTINGS PANEL -->
            <div
              v-if="shouldShowSettings"
              class="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-6 animate-fadeIn text-xs"
            >
              <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 class="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span>⚙️</span> Customization & Rules
                </h3>
                <button
                  class="text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  @click="resetConfigToDefaults"
                >
                  Reset Defaults
                </button>
              </div>

              <!-- PRESET MANAGER: SAVE, LOAD & EXPORT/IMPORT PRESETS -->
              <div class="space-y-3 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
                <h4 class="font-bold text-emerald-400 flex items-center justify-between">
                  <span>💾 Presets & Configuration Save/Load</span>
                </h4>

                <!-- Save Current Settings as Preset -->
                <div class="space-y-1.5">
                  <label class="block text-zinc-400 text-[11px]">Save Current Settings as Preset</label>
                  <div class="flex gap-2">
                    <input
                      v-model="newPresetName"
                      type="text"
                      placeholder="e.g. Debate Finals 2026"
                      class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                      @keyup.enter="handleSavePreset"
                    />
                    <button
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
                      @click="handleSavePreset"
                    >
                      💾 Save Preset
                    </button>
                  </div>
                </div>

                <!-- Saved Presets List & Load -->
                <div v-if="localConfig.presets && localConfig.presets.length > 0" class="space-y-1.5 pt-1">
                  <label class="block text-zinc-400 text-[11px]">Load Saved Preset</label>
                  <div class="flex gap-2 items-center">
                    <select
                      v-model="selectedPresetId"
                      class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 text-xs cursor-pointer"
                    >
                      <option value="" disabled>-- Select Preset --</option>
                      <option v-for="p in localConfig.presets" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ new Date(p.createdAt).toLocaleDateString() }})
                      </option>
                    </select>
                    <button
                      class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-40"
                      :disabled="!selectedPresetId"
                      @click="handleLoadPreset"
                    >
                      📂 Load
                    </button>
                    <button
                      class="px-2 py-1.5 bg-zinc-800 hover:bg-rose-950/80 text-rose-400 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-40"
                      :disabled="!selectedPresetId"
                      @click="handleDeletePreset(selectedPresetId)"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Export & Import Preset JSON -->
                <div class="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                  <button
                    class="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-[11px] cursor-pointer text-center"
                    @click="exportPresetJson"
                  >
                    📥 Export JSON
                  </button>
                  <button
                    class="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-[11px] cursor-pointer text-center"
                    @click="triggerImportPreset"
                  >
                    📤 Import JSON
                  </button>
                  <input
                    ref="presetFileInput"
                    type="file"
                    accept=".json"
                    class="hidden"
                    @change="handlePresetFileChange"
                  />
                </div>
              </div>

              <!-- SECTION 1: MAIN COUNTDOWN & SHADOW CUSTOMIZATION -->
              <div class="space-y-3.5">
                <h4 class="font-bold text-zinc-200 border-b border-zinc-800/60 pb-1 flex items-center justify-between">
                  <span>🎨 Main Countdown Appearance</span>
                </h4>

                <!-- Font Family -->
                <div>
                  <label class="block text-zinc-400 mb-1">Font Family</label>
                  <select
                    v-model="localConfig.appearance.fontFamily"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 cursor-pointer"
                    @change="emitConfigUpdate"
                  >
                    <option value="monospace">Monospace (Standard)</option>
                    <option value="sans-serif">Sans-Serif</option>
                    <option value="serif">Serif</option>
                    <option value="'Roboto Mono', monospace">Roboto Mono</option>
                    <option value="'Inter', sans-serif">Inter</option>
                  </select>
                </div>

                <!-- Default Text Color -->
                <div>
                  <label class="block text-zinc-400 mb-1">Default Digits Color</label>
                  <div class="flex gap-2 items-center">
                    <input
                      v-model="localConfig.appearance.defaultTextColor"
                      type="color"
                      class="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      @change="emitConfigUpdate"
                    />
                    <input
                      v-model="localConfig.appearance.defaultTextColor"
                      type="text"
                      class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                      @blur="emitConfigUpdate"
                    />
                  </div>
                </div>

                <!-- Overlay BG Color -->
                <div>
                  <label class="block text-zinc-400 mb-1">Overlay Background Color</label>
                  <input
                    v-model="localConfig.appearance.defaultBgColor"
                    type="text"
                    placeholder="transparent or #000000"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                    @blur="emitConfigUpdate"
                  />
                </div>

                <!-- Box Shadow & Glow Transparency Slider -->
                <div>
                  <div class="flex justify-between text-zinc-400 text-[11px] mb-1">
                    <span>Shadow & Glow Opacity</span>
                    <span class="font-mono text-zinc-300">{{ Math.round((localConfig.appearance.textShadowOpacity ?? 0.8) * 100) }}%</span>
                  </div>
                  <input
                    v-model.number="localConfig.appearance.textShadowOpacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full h-2 bg-zinc-800 rounded accent-emerald-500 cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                  <div class="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                    <span>0% (Flat / Transparent)</span>
                    <span>100% (Strong Shadow)</span>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: UNDERNEATH TEXT / OVERTIME CUSTOMIZATION -->
              <div class="space-y-3.5 pt-3 border-t border-zinc-800/80">
                <h4 class="font-bold text-zinc-200 border-b border-zinc-800/60 pb-1 flex items-center justify-between">
                  <span>⏱️ Underneath Text (Overtime)</span>
                </h4>

                <!-- Enable Overtime Background Box Toggle -->
                <div class="flex items-center justify-between py-1">
                  <div>
                    <div class="text-zinc-300 font-medium">Overtime Box Background</div>
                    <div class="text-[10px] text-zinc-500">Uncheck to disable background box entirely</div>
                  </div>
                  <input
                    v-model="localConfig.appearance.showOvertimeBg"
                    type="checkbox"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                </div>

                <!-- Overtime BG Color (if enabled) -->
                <div v-if="localConfig.appearance.showOvertimeBg">
                  <label class="block text-zinc-400 mb-1">Overtime Box BG Color</label>
                  <input
                    v-model="localConfig.appearance.overtimeBgColor"
                    type="text"
                    placeholder="rgba(69, 10, 10, 0.8)"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                    @blur="emitConfigUpdate"
                  />
                </div>

                <!-- Overtime Text Color -->
                <div>
                  <label class="block text-zinc-400 mb-1">Overtime Text Color</label>
                  <div class="flex gap-2 items-center">
                    <input
                      v-model="localConfig.appearance.overtimeTextColor"
                      type="color"
                      class="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      @change="emitConfigUpdate"
                    />
                    <input
                      v-model="localConfig.appearance.overtimeTextColor"
                      type="text"
                      class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                      @blur="emitConfigUpdate"
                    />
                  </div>
                </div>

                <!-- Border & Shadow Toggles -->
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center gap-2 cursor-pointer text-zinc-300 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <input
                      v-model="localConfig.appearance.showOvertimeBorder"
                      type="checkbox"
                      class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      @change="emitConfigUpdate"
                    />
                    <span>Show Border</span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer text-zinc-300 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <input
                      v-model="localConfig.appearance.showOvertimeShadow"
                      type="checkbox"
                      class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      @change="emitConfigUpdate"
                    />
                    <span>Show Shadow</span>
                  </label>
                </div>

                <!-- Overtime Badge Label -->
                <div>
                  <label class="block text-zinc-400 mb-1">Overtime Badge Text (leave blank to hide)</label>
                  <input
                    v-model="localConfig.appearance.overtimeLabel"
                    type="text"
                    placeholder="OVERTIME"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                    @blur="emitConfigUpdate"
                  />
                </div>

                <!-- Animate Overtime -->
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Pulsing / Bounce Animation</span>
                  <input
                    v-model="localConfig.appearance.animateOvertime"
                    type="checkbox"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                </div>

                <!-- Count Past Zero (Overtime master toggle) -->
                <div class="flex items-center justify-between pt-1">
                  <div>
                    <div class="text-zinc-300 font-medium">Count Past Zero (Master)</div>
                    <div class="text-[10px] text-zinc-500">Enable or disable negative overtime tracking</div>
                  </div>
                  <input
                    v-model="localConfig.countOvertime"
                    type="checkbox"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                </div>
              </div>

              <!-- SECTION 3: CUSTOMIZABLE ALERT RULES -->
              <div class="space-y-3 pt-3 border-t border-zinc-800/80">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-zinc-200">
                    🚦 Dynamic Alert & Flashing Rules
                  </h4>
                  <button
                    class="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                    @click="showAddRule = !showAddRule"
                  >
                    {{ showAddRule ? '✕ Cancel' : '+ Add Rule' }}
                  </button>
                </div>

                <!-- Add Rule Form -->
                <div
                  v-if="showAddRule"
                  class="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2.5 animate-fadeIn"
                >
                  <div class="font-bold text-emerald-400">Add New Condition Rule</div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-0.5">Rule Name</label>
                      <input
                        v-model="newRule.name"
                        type="text"
                        placeholder="e.g. Warning 45s"
                        class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-0.5">Trigger At (s)</label>
                      <input
                        v-model.number="newRule.triggerAt"
                        type="number"
                        placeholder="e.g. 45 or -10"
                        class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-0.5">Text Color</label>
                      <div class="flex gap-1.5 items-center">
                        <input
                          v-model="newRule.textColor"
                          type="color"
                          class="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer"
                        />
                        <input
                          v-model="newRule.textColor"
                          type="text"
                          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-400 mb-0.5">Sound Cue</label>
                      <select
                        v-model="newRule.sound"
                        class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 text-xs cursor-pointer"
                      >
                        <option value="none">None</option>
                        <option value="chime">Chime</option>
                        <option value="bell">Bell</option>
                        <option value="beep">Beep</option>
                        <option value="tick">Tick</option>
                        <option value="buzz">Buzz</option>
                        <optgroup v-if="localConfig.customSounds && localConfig.customSounds.length" label="Custom Audio">
                          <option v-for="cs in localConfig.customSounds" :key="cs.id" :value="cs.id">
                            🎵 {{ cs.name }}
                          </option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div class="space-y-2 pt-1 border-t border-zinc-800/60">
                    <label class="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        v-model="newRule.flash"
                        type="checkbox"
                        class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <span>Flash Urgently</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        v-model="newRule.soundEverySecond"
                        type="checkbox"
                        class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <span>🔊 Play Sound Every Second (Flash Sound)</span>
                    </label>

                    <div class="flex justify-end pt-1">
                      <button
                        class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                        @click="saveNewRule"
                      >
                        Save Rule
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Rules List -->
                <div class="space-y-2">
                  <div
                    v-for="rule in localConfig.rules"
                    :key="rule.id"
                    class="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0"
                        :style="{ backgroundColor: rule.textColor || '#fff' }"
                      />
                      <div class="min-w-0">
                        <div class="font-bold text-zinc-200 truncate">{{ rule.name }}</div>
                        <div class="text-[10px] text-zinc-400 font-mono flex flex-wrap gap-1 items-center">
                          <span>At ≤ {{ rule.triggerAt }}s</span>
                          <span v-if="rule.flash" class="text-amber-400">⚡ Flash</span>
                          <span v-if="rule.sound && rule.sound !== 'none'" class="text-blue-400">🔊 {{ rule.sound }}</span>
                          <span v-if="rule.soundEverySecond" class="text-emerald-400 font-bold">🔁 Every 1s</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1">
                      <button
                        v-if="rule.sound && rule.sound !== 'none'"
                        class="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                        title="Test sound"
                        @click="testSound(rule.sound)"
                      >
                        ▶ Sound
                      </button>
                      <button
                        class="w-6 h-6 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 flex items-center justify-center cursor-pointer"
                        title="Delete rule"
                        @click="removeRule(rule.id)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION 4: SOUND SETTINGS & CUSTOM SOUND UPLOADER -->
              <div class="space-y-3 pt-3 border-t border-zinc-800/80">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-zinc-200">
                    🔊 Audio Engine & Custom Sounds
                  </h4>
                  <button
                    class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-[11px] rounded-xl cursor-pointer flex items-center gap-1"
                    @click="triggerAudioUpload"
                  >
                    <span>🎵 Upload Sound</span>
                  </button>
                  <input
                    ref="audioFileInput"
                    type="file"
                    accept="audio/*"
                    class="hidden"
                    @change="handleAudioUpload"
                  />
                </div>

                <!-- Custom Uploaded Sounds List -->
                <div
                  v-if="localConfig.customSounds && localConfig.customSounds.length > 0"
                  class="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1.5"
                >
                  <div class="text-[11px] font-bold text-zinc-400">Custom Uploaded Sounds</div>
                  <div class="space-y-1">
                    <div
                      v-for="cs in localConfig.customSounds"
                      :key="cs.id"
                      class="flex items-center justify-between text-xs bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800"
                    >
                      <span class="font-mono text-zinc-200 truncate max-w-[150px]">🎵 {{ cs.name }}</span>
                      <div class="flex items-center gap-1">
                        <button
                          class="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                          @click="testSound(cs.id)"
                        >
                          ▶ Play
                        </button>
                        <button
                          class="w-5 h-5 rounded text-zinc-500 hover:text-rose-400 flex items-center justify-center cursor-pointer text-xs"
                          @click="deleteCustomSound(cs.id)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Enable Sound Effects</span>
                  <input
                    v-model="localConfig.sound.enableChimes"
                    type="checkbox"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                </div>

                <!-- Master Volume -->
                <div>
                  <div class="flex justify-between text-zinc-400 text-[11px] mb-1">
                    <span>Master Volume</span>
                    <span class="font-mono text-zinc-300">{{ Math.round(localConfig.sound.volume * 100) }}%</span>
                  </div>
                  <input
                    v-model.number="localConfig.sound.volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full h-2 bg-zinc-800 rounded accent-emerald-500 cursor-pointer"
                    @change="emitConfigUpdate"
                  />
                </div>

                <!-- Start Sound -->
                <div class="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label class="block text-zinc-400 text-[11px] mb-0.5">Start Chime</label>
                    <select
                      v-model="localConfig.sound.startSound"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 cursor-pointer text-xs"
                      @change="emitConfigUpdate"
                    >
                      <option value="chime">Chime (Melodic)</option>
                      <option value="bell">Bell</option>
                      <option value="beep">Beep</option>
                      <option value="none">Mute</option>
                      <optgroup v-if="localConfig.customSounds && localConfig.customSounds.length" label="Custom Audio">
                        <option v-for="cs in localConfig.customSounds" :key="cs.id" :value="cs.id">
                          🎵 {{ cs.name }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div class="pt-4">
                    <button
                      class="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
                      @click="testSound(localConfig.sound.startSound)"
                    >
                      Test Start Sound
                    </button>
                  </div>
                </div>

                <!-- End Sound -->
                <div class="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label class="block text-zinc-400 text-[11px] mb-0.5">End / Time Up Sound</label>
                    <select
                      v-model="localConfig.sound.endSound"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 cursor-pointer text-xs"
                      @change="emitConfigUpdate"
                    >
                      <option value="bell">Bell (Long Ring)</option>
                      <option value="chime">Chime</option>
                      <option value="buzz">Buzzer</option>
                      <option value="beep">Beep</option>
                      <option value="none">Mute</option>
                      <optgroup v-if="localConfig.customSounds && localConfig.customSounds.length" label="Custom Audio">
                        <option v-for="cs in localConfig.customSounds" :key="cs.id" :value="cs.id">
                          🎵 {{ cs.name }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div class="pt-4">
                    <button
                      class="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer"
                      @click="testSound(localConfig.sound.endSound)"
                    >
                      Test End Sound
                    </button>
                  </div>
                </div>

                <!-- Tick Sound -->
                <div class="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label class="block text-zinc-400 text-[11px] mb-0.5">Countdown Tick Sound</label>
                    <select
                      v-model="localConfig.sound.tickSound"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 cursor-pointer text-xs"
                      @change="emitConfigUpdate"
                    >
                      <option value="tick">Tick (Metronome)</option>
                      <option value="click">Wood Click</option>
                      <option value="beep">Beep</option>
                      <option value="none">Mute</option>
                      <optgroup v-if="localConfig.customSounds && localConfig.customSounds.length" label="Custom Audio">
                        <option v-for="cs in localConfig.customSounds" :key="cs.id" :value="cs.id">
                          🎵 {{ cs.name }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label class="block text-zinc-400 text-[11px] mb-0.5">Tick Under (s)</label>
                    <input
                      v-model.number="localConfig.sound.tickUnderXSeconds"
                      type="number"
                      min="0"
                      max="60"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                      @blur="emitConfigUpdate"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { defaultTimerConfig, type TimerConfig, type AlertRule } from '../composables/useTimerSocket'
import { playCustomSound } from '../utils/soundEngine'

const {
  timeRemaining,
  duration,
  status,
  speakerName,
  title,
  activeTimerId,
  timers,
  isConnected,
  config,
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
  deleteTimer,
  updateConfig,
  savePreset,
  loadPreset,
  deletePreset,
  addCustomSound,
  deleteCustomSound,
  setupKeyboardShortcuts
} = useTimerSocket()

// Register global Spacebar / Key shortcuts
setupKeyboardShortcuts()

// Clean unified navigation states
const activeTab = ref<'stage' | 'rundown' | 'settings'>('stage')
const desktopSideTab = ref<'rundown' | 'settings'>('rundown')

function setTab(tab: 'stage' | 'rundown' | 'settings') {
  activeTab.value = tab
  if (tab !== 'stage') {
    desktopSideTab.value = tab
  }
}

function setDesktopSideTab(tab: 'rundown' | 'settings') {
  desktopSideTab.value = tab
  activeTab.value = tab
}

// Computed view helpers
const shouldShowRundown = computed(() => {
  return desktopSideTab.value === 'rundown'
})

const shouldShowSettings = computed(() => {
  return desktopSideTab.value === 'settings'
})

// Scrubber state strictly clamped to [0, duration]
const scrubberValue = ref(Math.max(0, timeRemaining.value))
const isScrubbing = ref(false)

// Active inputs
const localTitle = ref('')
const localSpeaker = ref('')
const manualMins = ref(5)
const manualSecs = ref(0)
const copied = ref(false)
const overlayUrl = ref('/overlay')

// Add timer form
const showAddTimerForm = ref(false)
const newTimerTitle = ref('')
const newTimerSpeaker = ref('')
const newTimerMins = ref(5)
const newTimerSecs = ref(0)

// Settings local state
const localConfig = ref<TimerConfig>(JSON.parse(JSON.stringify(defaultTimerConfig)))

// Presets state & file refs
const newPresetName = ref('')
const selectedPresetId = ref('')
const presetFileInput = ref<HTMLInputElement | null>(null)
const audioFileInput = ref<HTMLInputElement | null>(null)

// Add rule form state
const showAddRule = ref(false)
const newRule = ref<AlertRule>({
  id: '',
  name: '',
  triggerAt: 15,
  textColor: '#fb923c',
  bgColor: 'transparent',
  flash: false,
  sound: 'none',
  soundEverySecond: false
})

const activeTimerIndex = computed(() => {
  return timers.value.findIndex(t => t.id === activeTimerId.value)
})

onMounted(() => {
  connect()
  scrubberValue.value = Math.max(0, timeRemaining.value)
  localTitle.value = title.value
  localSpeaker.value = speakerName.value
  manualMins.value = Math.floor(duration.value / 60)
  manualSecs.value = duration.value % 60
  if (config.value) {
    localConfig.value = JSON.parse(JSON.stringify(config.value))
  }
  if (window.location) {
    overlayUrl.value = `${window.location.origin}/overlay`
  }
})

// Keep scrubber in sync with non-negative timeRemaining
watch(timeRemaining, (val) => {
  if (!isScrubbing.value) {
    scrubberValue.value = Math.max(0, Math.min(duration.value, val))
  }
})

watch(duration, (val) => {
  manualMins.value = Math.floor(val / 60)
  manualSecs.value = val % 60
})

watch(title, (val) => {
  if (val !== localTitle.value) localTitle.value = val
})

watch(speakerName, (val) => {
  if (val !== localSpeaker.value) localSpeaker.value = val
})

watch(config, (val) => {
  if (val) {
    localConfig.value = JSON.parse(JSON.stringify(val))
  }
}, { deep: true })

function onScrubberInput() {
  isScrubbing.value = true
  setTime(scrubberValue.value)
}

function onScrubberChange() {
  isScrubbing.value = false
  setTime(scrubberValue.value)
}

function adjustSeconds(delta: number) {
  const target = Math.min(duration.value, timeRemaining.value + delta)
  setTime(target)
}

function applyManualDuration() {
  const total = Math.max(1, (manualMins.value || 0) * 60 + (manualSecs.value || 0))
  setDuration(total)
}

function quickSetDuration(seconds: number) {
  setDuration(seconds)
}

function updateActiveTitle() {
  setTitle(localTitle.value.trim())
}

function updateActiveSpeaker() {
  setSpeaker(localSpeaker.value.trim())
}

function submitNewTimer() {
  const totalSecs = Math.max(1, (newTimerMins.value || 0) * 60 + (newTimerSecs.value || 0))
  addTimer({
    title: newTimerTitle.value.trim() || `Timer ${timers.value.length + 1}`,
    speakerName: newTimerSpeaker.value.trim(),
    duration: totalSecs
  })
  newTimerTitle.value = ''
  newTimerSpeaker.value = ''
  newTimerMins.value = 5
  newTimerSecs.value = 0
  showAddTimerForm.value = false
}

function emitConfigUpdate() {
  updateConfig(localConfig.value)
}

function handleSavePreset() {
  if (!newPresetName.value.trim()) return
  savePreset(newPresetName.value.trim())
  newPresetName.value = ''
}

function handleLoadPreset() {
  if (!selectedPresetId.value) return
  loadPreset(selectedPresetId.value)
}

function handleDeletePreset(id: string) {
  deletePreset(id)
  if (selectedPresetId.value === id) selectedPresetId.value = ''
}

function exportPresetJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localConfig.value, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `timer-preset-${Date.now()}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

function triggerImportPreset() {
  presetFileInput.value?.click()
}

function handlePresetFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const imported = JSON.parse(evt.target?.result as string)
      if (imported && typeof imported === 'object') {
        updateConfig(imported)
      }
    } catch {
      alert('Invalid preset JSON file')
    }
  }
  reader.readAsText(file)
}

function triggerAudioUpload() {
  audioFileInput.value?.click()
}

function handleAudioUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    alert('Audio file size must be under 10MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => {
    const dataUrl = evt.target?.result as string
    if (dataUrl) {
      addCustomSound(file.name.replace(/\.[^/.]+$/, ''), dataUrl)
    }
  }
  reader.readAsDataURL(file)
}

function saveNewRule() {
  if (!newRule.value.name.trim()) return
  const ruleToSave: AlertRule = {
    ...newRule.value,
    id: `rule-${Date.now()}`
  }
  localConfig.value.rules.push(ruleToSave)
  emitConfigUpdate()
  showAddRule.value = false
  newRule.value = {
    id: '',
    name: '',
    triggerAt: 15,
    textColor: '#fb923c',
    bgColor: 'transparent',
    flash: false,
    sound: 'none',
    soundEverySecond: false
  }
}

function removeRule(id: string) {
  localConfig.value.rules = localConfig.value.rules.filter(r => r.id !== id)
  emitConfigUpdate()
}

function testSound(sound: string) {
  const customList = localConfig.value.customSounds || localConfig.value.sound?.customSounds || []
  playCustomSound(sound, localConfig.value.sound.volume, customList)
}

function resetConfigToDefaults() {
  localConfig.value = JSON.parse(JSON.stringify(defaultTimerConfig))
  emitConfigUpdate()
}

function formatSeconds(total: number) {
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function copyOverlayUrl() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(overlayUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const mainTimerShadowStyle = computed(() => {
  const opacity = localConfig.value.appearance.textShadowOpacity ?? 0.8
  if (opacity <= 0) return { filter: 'none' }
  return {
    filter: `drop-shadow(0 8px 24px rgba(0,0,0,${opacity}))`
  }
})

const timerTextStyle = computed(() => {
  if (activeRule.value?.textColor) {
    return { color: activeRule.value.textColor }
  }
  return { color: config.value.appearance.defaultTextColor || '#34d399' }
})

const flashClass = computed(() => {
  if (activeRule.value?.flash && status.value === 'running') {
    return 'animate-pulse'
  }
  return ''
})

useHead({
  title: 'Forever Timer - Stagetimer Controller'
})
</script>
