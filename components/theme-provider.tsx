'use client'

import * as React from 'react'

// Theme is forced to light across the app — no toggle, no system-preference
// follow. We drop next-themes here so it doesn't inject its inline <script>
// for flash-of-unstyled-content prevention (which trips a React warning).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
