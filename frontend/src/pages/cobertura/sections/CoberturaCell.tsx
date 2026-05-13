import type { CoberturaCell as CellData } from '../../../lib/api'
import { COLOR_HEX, COLOR_TEXTO } from '../../../lib/colors'
import { fmtNumber } from '../../../lib/format'

export default function CoberturaCell({ cell }: { cell: CellData }) {
  return (
    <td
      className="px-2 py-1.5 text-right text-xs font-medium tabular-nums whitespace-nowrap border-r last:border-r-0"
      style={{
        background: COLOR_HEX[cell.color],
        color: COLOR_TEXTO[cell.color],
        borderColor: 'var(--border-soft)',
      }}
    >
      {fmtNumber(cell.balance)}
    </td>
  )
}
