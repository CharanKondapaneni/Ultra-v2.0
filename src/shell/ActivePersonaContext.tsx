import { createContext, useContext } from 'react'

interface ActivePersonaContextValue {
  activePersonaId: string
}

const ActivePersonaContext = createContext<ActivePersonaContextValue>({ activePersonaId: '' })

export const ActivePersonaProvider = ActivePersonaContext.Provider
export const useActivePersona = () => useContext(ActivePersonaContext)
