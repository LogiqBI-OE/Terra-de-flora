import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-hero min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-auto px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
