// Hook + map de íconos compartidos para el navConfig dinámico.
//
// El backend envía un nombre de ícono (string) y aquí lo resolvemos a
// un componente. Cuando agregues un ícono nuevo al REGISTRY del backend,
// agrégalo también aquí.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { navApi, type NavConfig } from './api'
import {
  IconBox,
  IconBriefcase,
  IconCalendar,
  IconChart,
  IconChat,
  IconHome,
  IconManual,
  IconMegaphone,
  IconNetwork,
  IconPlug,
  IconSettings,
  IconUserCircle,
  IconUsers,
} from '../components/icons/Icons'
import { useAuth } from './auth'

export const ICON_MAP: Record<string, () => ReactNode> = {
  box: () => <IconBox />,
  briefcase: () => <IconBriefcase />,
  calendar: () => <IconCalendar />,
  chart: () => <IconChart />,
  chat: () => <IconChat />,
  home: () => <IconHome />,
  manual: () => <IconManual />,
  megaphone: () => <IconMegaphone />,
  network: () => <IconNetwork />,
  plug: () => <IconPlug />,
  settings: () => <IconSettings />,
  'user-circle': () => <IconUserCircle />,
  users: () => <IconUsers />,
}

export function renderIcon(name: string): ReactNode {
  const fn = ICON_MAP[name]
  return fn ? fn() : null
}

interface NavCtx {
  config: NavConfig | null
  loading: boolean
  reload: () => Promise<void>
}

const Ctx = createContext<NavCtx | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [config, setConfig] = useState<NavConfig | null>(null)
  const [loading, setLoading] = useState(true)

  async function reload() {
    if (!user) {
      setConfig(null); setLoading(false)
      return
    }
    try {
      const c = await navApi.get()
      setConfig(c)
    } catch {/* falla silenciosa: sidebar queda vacío hasta retry */}
    finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return <Ctx.Provider value={{ config, loading, reload }}>{children}</Ctx.Provider>
}

export function useNav(): NavCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNav debe usarse dentro de NavProvider')
  return ctx
}
