import { useState, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/shell/AppShell'
import { useConfig } from '@/hooks/useConfig'
import registry from '@/pages/registry'
import { SessionProvider, useSession } from '@/auth/SessionContext'
import LoginScreen from '@/screens/LoginScreen'
import ChooseClientScreen from '@/screens/ChooseClientScreen'
import ClientLoginScreen from '@/screens/ClientLoginScreen'
import { ULTRA_SLUG, CLIENT_ID } from '@/auth/access'
import { ActivePersonaProvider, useActivePersona } from '@/shell/ActivePersonaContext'
import { resolvePersona } from '@/utils/resolvePersona'



function UltraGateRoute() {
  const { isUnlocked } = useSession()
  if (isUnlocked) return <UltraGateRedirect />
  return <LoginScreen />
}

/** Redirects an already-logged-in client user to their first page. */
function UltraGateRedirect() {
  return <Navigate to="/ask" replace />
}

function ProtectedApp() {
  const { isUnlocked, exitPath } = useSession()

  if (!isUnlocked) return <Navigate to={exitPath || `/login/${ULTRA_SLUG}`} replace />

  return <ProtectedAppInner />
}

/** Config is only fetched once we know the user is logged in and have a clientId. */
function ProtectedAppInner() {
  const config = useConfig()
  const { personas, client, defaultPersonaId } = config
  const { sessionPersonaId, signOut } = useSession()
  const [activePersonaId, setActivePersonaId] = useState<string>(() => {
    const stored = sessionStorage.getItem('active_persona')
    // Only trust the stored value if it matches the current session's persona.
    // A stale ID from a previous login would cause an immediate sign-out.
    const isTrusted = stored && (stored === sessionPersonaId || stored === defaultPersonaId)
    return isTrusted ? stored : (sessionPersonaId ?? defaultPersonaId)
  })

  const handlePersonaSwitch = (id: string) => {
    sessionStorage.setItem('active_persona', id)
    setActivePersonaId(id)
  }

  const persona = personas.find(p => p.id === activePersonaId) ?? personas[0]

  useEffect(() => {
    document.title = client.name
    return () => { document.title = 'Ultra' }
  }, [client.name])

  // Only sign out if persona is still missing after a tick — guards against
  // the initial render where sessionPersona state hasn't settled yet.
  useEffect(() => {
    if (persona) return
    const t = setTimeout(() => { if (!persona) signOut() }, 300)
    return () => clearTimeout(t)
  }, [persona])

  if (!persona) return null

  return (
    <ActivePersonaProvider value={{ activePersonaId }}>
      <AppShell
        persona={persona}
        personas={personas}
        client={client}
        onPersonaSwitch={handlePersonaSwitch}
      />
    </ActivePersonaProvider>
  )
}

/** Renders the page component for the active client + persona at the current path. */
function PersonaPageDispatcher({ path }: { path: string }) {
  const { activePersonaId } = useActivePersona()
  const { scopedClientId } = useSession()
  const clientId = scopedClientId ?? CLIENT_ID
  const Page = registry[clientId]?.[resolvePersona(activePersonaId)]?.[path]
  return Page ? <Page /> : null
}

/** All page paths come from the registry — enumerate them so React Router can match. */
const ALL_PATHS = [...new Set(
  Object.values(registry).flatMap(client =>
    Object.values(client).flatMap(persona =>
      Object.keys(persona)
    )
  )
)]

function AppRoutes() {
  return (
    <Routes>
      <Route path={`/login/${ULTRA_SLUG}`} element={<UltraGateRoute />} />
      <Route path="/clients" element={<ChooseClientScreen />} />
      <Route path="/login/:clientId" element={<Suspense fallback={<AppLoader />}><ClientLoginScreen /></Suspense>} />
      <Route path="/login" element={<Navigate to={`/login/${ULTRA_SLUG}`} replace />} />

      <Route element={<ProtectedApp />}>
        <Route index element={<Navigate to="/ask" replace />} />
        {ALL_PATHS.map(path => (
          <Route key={path} path={path} element={<PersonaPageDispatcher path={path} />} />
        ))}
        <Route path="*" element={<Navigate to="/ask" replace />} />
      </Route>
    </Routes>
  )
}


function AppLoader() {
  return (
    <div className="min-h-screen bg-[#0a1633] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <p className="text-xs text-white/35 uppercase tracking-widest">Loading</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Suspense fallback={<AppLoader />}>
          <AppRoutes />
        </Suspense>
      </SessionProvider>
    </BrowserRouter>
  )
}
