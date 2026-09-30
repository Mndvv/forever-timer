import type { TimerConfig, TimerItem, CustomSound } from '../composables/useTimerSocket'

/**
 * Helper to convert a Data URL (e.g. data:audio/mp3;base64,...) to Uint8Array & MIME type
 */
function dataUrlToBinary(dataUrl: string): { data: Uint8Array; mime: string; ext: string } {
  const parts = dataUrl.split(',')
  const mimeMatch = parts[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'audio/mp3'
  const binaryStr = typeof atob !== 'undefined' ? atob(parts[1] || '') : Buffer.from(parts[1] || '', 'base64').toString('binary')
  const len = binaryStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  let ext = 'mp3'
  if (mime.includes('wav')) ext = 'wav'
  else if (mime.includes('ogg')) ext = 'ogg'
  else if (mime.includes('aac')) ext = 'aac'
  else if (mime.includes('m4a')) ext = 'm4a'

  return { data: bytes, mime, ext }
}

/**
 * Helper to convert Uint8Array / Blob to Data URL
 */
function binaryToDataUrl(bytes: Uint8Array, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      const base64 = Buffer.from(bytes).toString('base64')
      resolve(`data:${mime};base64,${base64}`)
      return
    }
    const blob = new Blob([bytes], { type: mime })
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(blob)
  })
}

/**
 * Package full preset configuration and custom audio files into a single downloadable .zip file
 */
export async function exportPresetZip(
  config: TimerConfig,
  timers?: TimerItem[],
  presetName?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const JSZipModule = await import('jszip')
  const JSZip = JSZipModule.default || JSZipModule
  const zip = new JSZip()
  const customSounds: CustomSound[] = config.customSounds || config.sound?.customSounds || []

  // Clean config copy for JSON manifest
  const manifestConfig: TimerConfig = JSON.parse(JSON.stringify(config))
  const audioManifest: Array<{ id: string; name: string; filename: string; mime: string }> = []

  // Add custom audio files to zip
  const audioFolder = zip.folder('audio')
  if (audioFolder && customSounds.length > 0) {
    for (const cs of customSounds) {
      if (cs.dataUrl && cs.dataUrl.startsWith('data:')) {
        const { data, mime, ext } = dataUrlToBinary(cs.dataUrl)
        const filename = `${cs.id}.${ext}`
        audioFolder.file(filename, data)
        audioManifest.push({
          id: cs.id,
          name: cs.name,
          filename,
          mime
        })
      }
    }
  }

  const manifest = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    presetName: presetName || 'Preset Bundle',
    config: manifestConfig,
    timers: timers || [],
    audioManifest
  }

  zip.file('config.json', JSON.stringify(manifest, null, 2))

  const content = await zip.generateAsync({ type: 'blob' })
  const blobUrl = URL.createObjectURL(content)

  const downloadAnchor = document.createElement('a')
  downloadAnchor.href = blobUrl
  const safeName = (presetName || 'timer-preset-bundle').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  downloadAnchor.download = `${safeName}-${Date.now()}.zip`
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
  URL.revokeObjectURL(blobUrl)
}

/**
 * Import a full preset ZIP file containing config.json and audio/ folder, restoring custom sounds & settings
 */
export async function importPresetZip(
  file: File
): Promise<{ config: TimerConfig; timers?: TimerItem[] }> {
  if (typeof window === 'undefined') {
    throw new Error('ZIP import is only supported in browser client')
  }

  const JSZipModule = await import('jszip')
  const JSZip = JSZipModule.default || JSZipModule
  const zip = await JSZip.loadAsync(file)

  const configFile = zip.file('config.json')
  if (!configFile) {
    throw new Error('Invalid preset ZIP: missing config.json file')
  }

  const configJsonText = await configFile.async('text')
  const manifest = JSON.parse(configJsonText)

  const importedConfig: TimerConfig = manifest.config || manifest
  const importedTimers: TimerItem[] = manifest.timers || []
  const audioManifest: Array<{ id: string; name: string; filename: string; mime: string }> = manifest.audioManifest || []

  const restoredCustomSounds: CustomSound[] = []

  // Restore custom sounds from audio/ directory
  if (audioManifest.length > 0) {
    for (const item of audioManifest) {
      const audioFile = zip.file(`audio/${item.filename}`) || zip.file(item.filename)
      if (audioFile) {
        const bytes = await audioFile.async('uint8array')
        const dataUrl = await binaryToDataUrl(bytes, item.mime || 'audio/mp3')
        restoredCustomSounds.push({
          id: item.id,
          name: item.name,
          dataUrl
        })
      }
    }
  }

  // Merge restored custom sounds back into config
  importedConfig.customSounds = restoredCustomSounds
  if (importedConfig.sound) {
    importedConfig.sound.customSounds = restoredCustomSounds
  }

  return {
    config: importedConfig,
    timers: importedTimers
  }
}
