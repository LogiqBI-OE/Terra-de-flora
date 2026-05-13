import AppShell from '../components/layout/AppShell'
import Card, { CardBody } from '../components/ui/Card'

export default function ClienteDashboard() {
  const cards = [
    { titulo: 'Coberturas activas', valor: '—' },
    { titulo: 'Próximos vencimientos', valor: '—' },
    { titulo: 'Solicitudes abiertas', valor: '—' },
  ]
  return (
    <AppShell title="Dashboard · Cliente">
      <div className="max-w-6xl">
        <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
        <p className="text-sm text-slate-400 mb-8">Panel de cliente — coberturas asignadas y estatus operativo.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <Card key={c.titulo}>
              <CardBody>
                <div className="text-xs tracking-widest uppercase text-slate-500 mb-2">{c.titulo}</div>
                <div className="text-4xl font-bold text-oleo-green">{c.valor}</div>
                <div className="text-xs text-slate-500 mt-3">Próximamente</div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
