import { useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type DiningTable, type TableInput } from '../api'

type Props = {
  tables: DiningTable[]
  onChanged: () => Promise<void>
}

type Position = { id: number, x: number, y: number }

export function TableManager({ tables, onChanged }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingId = useRef<number | null>(null)
  const draftPositionRef = useRef<Position | null>(null)
  const [draftPosition, setDraftPosition] = useState<Position | null>(null)
  const [tableId, setTableId] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [capacity, setCapacity] = useState('2')
  const [shape, setShape] = useState<TableInput['shape']>('round')
  const [positionX, setPositionX] = useState('10')
  const [positionY, setPositionY] = useState('10')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function resetForm() {
    setTableId(null)
    setLabel('')
    setCapacity('2')
    setShape('round')
    setPositionX('10')
    setPositionY('10')
  }

  function editTable(table: DiningTable) {
    setTableId(table.id)
    setLabel(table.label)
    setCapacity(String(table.capacity))
    setShape(table.shape)
    setPositionX(table.position_x)
    setPositionY(table.position_y)
    setError('')
    setMessage('')
  }

  async function saveTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveTable({
        label: label.trim(),
        capacity: Number(capacity),
        shape,
        position_x: Number(positionX),
        position_y: Number(positionY),
      }, tableId ?? undefined)
      await onChanged()
      resetForm()
      setMessage('Table saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save table.')
    } finally {
      setBusy(false)
    }
  }

  async function removeTable(table: DiningTable) {
    if (!window.confirm(`Delete table ${table.label}?`)) return
    setBusy(true)
    setError('')
    try {
      await api.deleteTable(table.id)
      await onChanged()
      if (tableId === table.id) resetForm()
      setMessage('Table deleted.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete table.')
    } finally {
      setBusy(false)
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, table: DiningTable) {
    if (busy) return
    editTable(table)
    draggingId.current = table.id
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>, table: DiningTable) {
    if (draggingId.current !== table.id || !boardRef.current) return
    const bounds = boardRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(90, Math.round(((event.clientX - bounds.left - 35) / bounds.width) * 100)))
    const y = Math.max(0, Math.min(90, Math.round(((event.clientY - bounds.top - 35) / bounds.height) * 100)))
    const nextPosition = { id: table.id, x, y }
    draftPositionRef.current = nextPosition
    setDraftPosition(nextPosition)
  }

  async function handlePointerUp(table: DiningTable) {
    if (draggingId.current !== table.id) return
    draggingId.current = null
    const position = draftPositionRef.current
    if (!position || position.id !== table.id) return
    setBusy(true)
    setError('')
    try {
      await api.saveTable({
        label: table.label,
        capacity: table.capacity,
        shape: table.shape,
        position_x: position.x,
        position_y: position.y,
      }, table.id)
      await onChanged()
      setPositionX(String(position.x))
      setPositionY(String(position.y))
      setMessage('Table position saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not move table.')
    } finally {
      setDraftPosition(null)
      draftPositionRef.current = null
      setBusy(false)
    }
  }

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div><p className="eyebrow">YOUR FLOOR</p><h1>Tables & layout</h1></div>
        <p>Add tables, set their capacity, and drag them into place.</p>
      </div>
      {error && <div className="notice error-message" role="alert">{error}</div>}
      {message && <div className="notice success-message" role="status">{message}</div>}
      <div className="layout-grid">
        <section className="panel layout-panel">
          <div className="panel-heading"><h2>Floor plan <span className="count">{tables.length} tables</span></h2><small>Drag to arrange</small></div>
          <div className="floor-board" ref={boardRef} aria-label="Table floor layout">
            <span className="entrance-label">ENTRANCE</span>
            {tables.length === 0 && <span className="board-empty">Add a table to begin the layout.</span>}
            {tables.map((table) => {
              const x = draftPosition?.id === table.id ? draftPosition.x : Number(table.position_x)
              const y = draftPosition?.id === table.id ? draftPosition.y : Number(table.position_y)
              return (
                <button
                  type="button"
                  key={table.id}
                  className={`floor-table shape-${table.shape}${tableId === table.id ? ' selected' : ''}`}
                  style={{
                    left: `min(${x}%, calc(100% - ${table.shape === 'rectangle' ? 88 : 70}px))`,
                    top: `min(${y}%, calc(100% - 70px))`,
                  }}
                  onClick={() => editTable(table)}
                  onPointerDown={(event) => handlePointerDown(event, table)}
                  onPointerMove={(event) => handlePointerMove(event, table)}
                  onPointerUp={() => void handlePointerUp(table)}
                  onPointerCancel={() => { draggingId.current = null; draftPositionRef.current = null; setDraftPosition(null) }}
                  aria-label={`Table ${table.label}, ${table.capacity} seats. Select to edit or drag to move.`}
                >
                  <strong>{table.label}</strong><small>{table.capacity} seats</small>
                </button>
              )
            })}
          </div>
        </section>
        <section className="panel table-editor">
          <div className="panel-heading"><h2>{tableId ? `Edit ${label}` : 'Add table'}</h2></div>
          <form className="compact-form" onSubmit={(event) => void saveTable(event)}>
            <label className="field">Table label
              <input value={label} onChange={(event) => setLabel(event.target.value)} required maxLength={50} placeholder="e.g. T3" />
            </label>
            <div className="form-grid">
              <label className="field">Seats
                <input type="number" min="1" max="20" value={capacity} onChange={(event) => setCapacity(event.target.value)} required />
              </label>
              <label className="field">Shape
                <select value={shape} onChange={(event) => setShape(event.target.value as TableInput['shape'])}>
                  <option value="round">Round</option><option value="square">Square</option><option value="rectangle">Rectangle</option>
                </select>
              </label>
              <label className="field">X position (%)
                <input type="number" min="0" max="90" step="0.01" value={positionX} onChange={(event) => setPositionX(event.target.value)} required />
              </label>
              <label className="field">Y position (%)
                <input type="number" min="0" max="90" step="0.01" value={positionY} onChange={(event) => setPositionY(event.target.value)} required />
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" isDisabled={busy}>{tableId ? 'Save table' : 'Add table'}</Button>
              {tableId && <button type="button" className="text-button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
          <div className="list-stack">
            {tables.map((table) => (
              <div className="list-row" key={table.id}>
                <div><strong>{table.label}</strong><small>{table.capacity} seats · {table.shape}</small></div>
                <div className="row-actions"><button type="button" onClick={() => editTable(table)} disabled={busy}>Edit</button><button type="button" onClick={() => void removeTable(table)} disabled={busy}>Delete</button></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
