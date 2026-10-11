import { useLayoutEffect } from 'react'

/**
 * Switches the accent colour for as long as the calling screen is mounted. It goes on the document root, not on
 * a wrapper, because popups (the dropdown list) are rendered in a portal outside any wrapper.
 */
export function useAccentTheme(themeClass: 'theme-teal') {
  useLayoutEffect(() => {
    document.documentElement.classList.add(themeClass)
    return () => document.documentElement.classList.remove(themeClass)
  }, [themeClass])
}
