// Tab Comentarios — wrapper sobre ProyectoChatPanel.

import ProyectoChatPanel from '../../../components/comentarios/ProyectoChatPanel'
import type { ProyectoRow } from '../../../lib/api'

interface Props {
  proyecto: ProyectoRow
  /** Callback opcional para refrescar el badge de la pill al leer/cambiar. */
  onChange?: () => void
}

export default function ComentariosTab({ proyecto, onChange }: Props) {
  return (
    <ProyectoChatPanel
      proyectoId={proyecto.id}
      className="h-[calc(100vh-300px)] min-h-[500px]"
      onRead={onChange}
      onChange={onChange}
    />
  )
}
