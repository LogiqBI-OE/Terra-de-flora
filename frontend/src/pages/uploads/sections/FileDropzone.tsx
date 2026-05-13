import { useRef, useState } from 'react'
import { uploadsApi, type TipoUpload, type UploadResult, ApiError } from '../../../lib/api'
import Spinner from '../../../components/ui/Spinner'

interface Props {
  snapshotId: number
  tipo: TipoUpload
  label: string
  onResult: (result: UploadResult) => void
}

export default function FileDropzone({ snapshotId, tipo, label, onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [hover, setHover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setFilename(file.name)
    setLoading(true)
    setError(null)
    try {
      const result = await uploadsApi.upload(snapshotId, tipo, file)
      onResult(result)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al subir el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setHover(true)
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault()
        setHover(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-lg border-2 border-dashed px-5 py-6 text-center transition"
      style={{
        borderColor: hover ? 'var(--accent)' : 'var(--border-strong)',
        background: hover ? 'rgba(168,208,96,0.06)' : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="text-sm font-semibold text-app mb-1">{label}</div>
      <div className="text-xs text-app-muted">
        {loading ? (
          <span className="text-accent inline-flex items-center gap-2">
            <Spinner /> Subiendo {filename}...
          </span>
        ) : filename ? (
          <span>Último: {filename}</span>
        ) : (
          <span>Arrastra el .xlsx aquí o haz click</span>
        )}
      </div>
      {error && <div className="mt-2 text-xs" style={{ color: '#dc2626' }}>{error}</div>}
    </div>
  )
}
