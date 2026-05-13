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
      className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-6 text-center transition ${
        hover ? 'border-oleo-green bg-oleo-green/5' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="text-sm font-semibold text-white mb-1">{label}</div>
      <div className="text-xs text-slate-500">
        {loading ? (
          <span className="text-oleo-green inline-flex items-center gap-2">
            <Spinner /> Subiendo {filename}...
          </span>
        ) : filename ? (
          <span>Último: {filename}</span>
        ) : (
          <span>Arrastra el .xlsx aquí o haz click</span>
        )}
      </div>
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  )
}
