import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal typing for the Chromium `beforeinstallprompt` event. Not in lib.dom,
 * and Firefox/Safari never fire it, so everything here degrades gracefully.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    platform: string
    outcome: 'accepted' | 'dismissed'
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const standaloneDisplay =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches === true
  // iOS Safari exposes a non-standard `navigator.standalone`.
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return standaloneDisplay || iosStandalone
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(isStandalone)

  useEffect(() => {
    const onBeforeInstall = (event: BeforeInstallPromptEvent) => {
      // Prevent the browser's own mini-infobar so we control the trigger.
      event.preventDefault()
      setDeferred(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return null
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setDeferred(null)
    return choice
  }, [deferred])

  return {
    /** True when the browser offered an install we can trigger programmatically. */
    canInstall: deferred !== null,
    /** True when the app is already running as an installed/standalone app. */
    installed,
    /** Trigger the native install prompt (only when `canInstall`). */
    promptInstall,
    /** iOS never fires `beforeinstallprompt`; used to show manual steps. */
    isIOS: isIOS(),
  }
}
