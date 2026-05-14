// Nuevo Proyecto — formulario inspirado en Dinox.
// Layout 2 columnas:
//   - LEFT: seleccion de cliente (search typeahead + crear nuevo via drawer)
//   - RIGHT: datos del proyecto (nombre, tipo, vendedor, fecha, valor, lugar, descripcion)

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import TextField from '../../components/ui/TextField'
import { IconBuilding, IconChevronRight, IconPlus, IconSearch, IconX } from '../../components/icons/Icons'
import {
  MOCK_CLIENTES,
  MOCK_VENDEDORES,
  TIPOS_PROYECTO,
  type Cliente,
} from './data/mockData'
import NuevoClienteDrawer from './sections/NuevoClienteDrawer'

export default function NuevoProyectoPage() {
  const navigate = useNavigate()

  // Cliente
  const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Proyecto
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<string>('boda')
  const [vendedor, setVendedor] = useState<string>(MOCK_VENDEDORES[0].handle)
  const [fechaEvento, setFechaEvento] = useState<string>('')
  const [valor, setValor] = useState<string>('')
  const [calle, setCalle] = useState('')
  const [colonia, setColonia] = useState('')
  const [municipio, setMunicipio] = useState('Monterrey')
  const [cp, setCp] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientes.slice(0, 4)
    return clientes.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      (c.rfc ?? '').toLowerCase().includes(q)
    ).slice(0, 6)
  }, [search, clientes])

  function handleClienteCreated(c: Cliente) {
    setClientes((prev) => [c, ...prev])
    setSelected(c)
    setDrawerOpen(false)
  }

  function handleSubmit() {
    // Por ahora solo navega de regreso al gestor (no persiste a backend)
    alert(`Proyecto "${nombre}" creado en demo (no persistido).\nCliente: ${selected?.nombre}\nTipo: ${tipo}\nFecha: ${fechaEvento}`)
    navigate('/proyectos')
  }

  const canSubmit = selected !== null && nombre.trim() && fechaEvento && vendedor

  return (
    <AppShell title="Nuevo proyecto">
      <div className="space-y-5">
        {/* Header: breadcrumb + actions */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-1">
              <button
                onClick={() => navigate('/proyectos')}
                className="hover:text-app transition"
              >
                Mis Proyectos
              </button>
              <IconChevronRight size={12} />
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Nuevo proyecto</span>
            </div>
            <h1 className="text-2xl font-bold text-app">Nuevo proyecto</h1>
            <p className="text-sm text-app-secondary">
              Selecciona el cliente y completa los datos del evento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/proyectos')}>Cancelar</Button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                boxShadow: '0 6px 20px var(--accent-shadow)',
              }}
            >
              Crear proyecto
            </button>
          </div>
        </div>

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* LEFT — cliente */}
          <div
            className="lg:col-span-3 rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-app">Cliente</h2>
                <p className="text-xs text-app-muted">Busca un cliente existente o crea uno nuevo.</p>
              </div>
            </div>

            {/* Selected cliente card */}
            {selected ? (
              <div
                className="rounded-lg border p-3 flex items-start justify-between"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg-soft)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                  >
                    {selected.tipo === 'PM' ? <IconBuilding size={20} /> : '👤'}
                  </div>
                  <div>
                    <div className="font-semibold text-app">{selected.nombre}</div>
                    <div className="text-xs text-app-secondary">
                      {selected.telefono}
                      {selected.email && <> · {selected.email}</>}
                    </div>
                    {selected.rfc && (
                      <div className="text-[10px] text-app-muted font-mono mt-0.5">{selected.rfc}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-muted"
                  aria-label="Cambiar cliente"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              <>
                {/* Search input */}
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
                    aria-hidden
                  >
                    <IconSearch size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, RFC o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Resultados */}
                <div className="mt-3 space-y-1.5">
                  {results.length === 0 ? (
                    <div className="text-xs text-app-muted py-4 text-center">Sin coincidencias.</div>
                  ) : results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition text-left hover:border-[var(--accent)]"
                      style={{
                        borderColor: 'var(--border-soft)',
                        background: 'var(--bg-elevated)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs"
                          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                        >
                          {c.tipo === 'PM' ? '🏢' : '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-app truncate">{c.nombre}</div>
                          <div className="text-[11px] text-app-muted truncate">
                            {c.telefono} {c.rfc && <>· <span className="font-mono">{c.rfc}</span></>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-app-muted shrink-0">
                        {c.tipo === 'PM' ? 'Moral' : 'Física'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Crear nuevo */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition"
                  style={{
                    borderColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <IconPlus size={14} />
                  Crear nuevo cliente
                </button>
              </>
            )}
          </div>

          {/* RIGHT — datos del proyecto */}
          <div
            className="lg:col-span-2 rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-bold text-app mb-1">Datos del proyecto</h2>
            <p className="text-xs text-app-muted mb-4">Información del evento.</p>

            <div className="space-y-4">
              <TextField
                label="Nombre del proyecto"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Boda Sada — Ceremonia & Recepción"
              />

              {/* Tipo de proyecto — cards */}
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
                  Tipo de proyecto <span style={{ color: 'var(--danger)' }}>*</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIPOS_PROYECTO.map((t) => {
                    const active = tipo === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id)}
                        className="rounded-lg border-2 py-2 px-1 text-center transition"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                          background: active ? 'var(--accent-bg-soft)' : 'var(--bg-input)',
                        }}
                      >
                        <div className="text-lg leading-none">{t.emoji}</div>
                        <div
                          className="text-[10px] mt-1 font-medium"
                          style={{ color: active ? 'var(--accent-text)' : 'var(--text-secondary)' }}
                        >
                          {t.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Vendedor <span style={{ color: 'var(--danger)' }}>*</span>
                </div>
                <select
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {MOCK_VENDEDORES.map((v) => (
                    <option key={v.handle} value={v.handle}>{v.nombre} (@{v.handle})</option>
                  ))}
                </select>
              </div>

              <TextField
                label="Fecha del evento"
                type="date"
                required
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
              />

              <TextField
                label="Valor estimado (MXN)"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0"
              />

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Lugar del evento
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Calle y número"
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Colonia"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      placeholder="C.P."
                      value={cp}
                      onChange={(e) => setCp(e.target.value)}
                      maxLength={5}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Municipio"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Descripción
                  <span className="font-normal normal-case tracking-normal text-app-muted ml-1">(opcional)</span>
                </div>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Alcance, requerimientos del cliente, particularidades..."
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <NuevoClienteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleClienteCreated}
      />
    </AppShell>
  )
}
