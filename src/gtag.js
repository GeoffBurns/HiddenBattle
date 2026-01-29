import { bh } from './terrain.js'

export const gtag = globalThis.gtag

export function trackLevelEnd (map, success) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || bh.map

  const params = {
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title,
    success: !!success
  }

  globalThis.gtag('event', 'level_end', params)
}

export function trackClick (map, button) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }
  map = map || bh.map

  const params = {
    event_category: 'Engagement',
    event_label: button,
    level_name: map.title || 'unknown',
    terrain: map.terrain || 'unknown',
    height: map.rows || 0,
    width: map.cols || 0,
    mode: document.title
  }

  globalThis.gtag('event', 'button_click', params)
}

export function trackTab (tab) {
  if (typeof globalThis.gtag !== 'function') {
    console.warn('GA not initialized')
    return
  }

  const params = {
    event_category: 'Engagement',
    event_label: tab,
    mode: document.title
  }

  globalThis.gtag('event', 'tab_click', params)
}
