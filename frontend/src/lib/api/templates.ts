import { requestBlob } from './client'
import type { TipoUpload } from './uploads'

export const templatesApi = {
  /** Descarga el .xlsx del template y dispara save-as en el navegador. */
  async downloadAndSave(tipo: TipoUpload): Promise<void> {
    const blob = await requestBlob(`/templates/${tipo}.xlsx`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${tipo}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
