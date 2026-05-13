import AppShell from '../components/layout/AppShell'
import Card, { CardBody } from '../components/ui/Card'

export default function AdminDashboard() {
  const cards = [
    { titulo: 'Clientes', valor: '—' },
    { titulo: 'Coberturas activas', valor: '—' },
    { titulo: 'Próximos vencimientos', valor: '—' },
    { titulo: 'Solicitudes pendientes', valor: '—' },
  ]
  const modulos = ['Gestión de clientes', 'Catálogo de coberturas', 'Reportes / BI']

  return (
    <AppShell title="Dashboard · Admin">
      <div className="max-w-6xl">
        <h2 className="text-2xl font-bold text-white mb-2">Panel de Administración</h2>
        <p className="text-sm text-slate-400 mb-8">Gestión de coberturas, usuarios y configuración del workspace.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <section className="mt-12">
          <h3 className="text-lg font-semibold text-white mb-4">Módulos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modulos.map((m) => (
              <Card key={m}>
                <CardBody className="text-slate-300">{m}</CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
