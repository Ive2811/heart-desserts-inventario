'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_SETTINGS, type BusinessSettings } from '@/lib/business'

const BusinessContext = createContext<BusinessSettings>(DEFAULT_SETTINGS)

// Reparte la identidad del negocio (nombre, moneda, logo) a los componentes de cliente
export function BusinessProvider({ settings, children }: { settings: BusinessSettings; children: React.ReactNode }) {
  return <BusinessContext.Provider value={settings}>{children}</BusinessContext.Provider>
}

export const useBusiness = () => useContext(BusinessContext)
