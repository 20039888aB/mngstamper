import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { PreferencesProvider } from './PreferencesContext'
import { ThemeProvider } from './ThemeContext'
import { TemplatesProvider } from './TemplatesContext'
import { HistoryProvider } from './HistoryContext'

/** Single mount point for all global providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <TemplatesProvider>
          <HistoryProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </HistoryProvider>
        </TemplatesProvider>
      </ThemeProvider>
    </PreferencesProvider>
  )
}
