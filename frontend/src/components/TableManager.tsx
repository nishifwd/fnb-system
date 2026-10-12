import { useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { Button } from '@heroui/react'
import { api, type DiningTable, type FloorArea, type FloorLayout, type TableInput } from '../api'

type Props = {
  areas: FloorArea[]
  layout: FloorLayout
  tables: DiningTable[]
  onChanged: () => Promise<void>
}

type Position = { id: number, x: number, y: number }
type Bounds = { id: number, x: number, y: number, width: number, height: number }
type EntrancePosition = { x: string, y: string }

function areaBounds(area: FloorArea): Bounds {
  return { id: area.id, x: Number(area.position_x), y: Number(area.position_y), width: Number(area.width), height: Number(area.height) }
}

function nextRotation(rotation: DiningTable['rotation']): DiningTable['rotation'] {
  return ((rotation + 90) % 360) as DiningTable['rotation']
}

function tableFootprint(shape: DiningTable['shape'], rotation: DiningTable['rotation']) {
  if (shape !== 'rectangle') return { width: 60, height: 60 }
  return rotation === 90 || rotation === 270
    ? { width: 54, height: 96 }
    : { width: 96, height: 54 }
}

function tableInput(table: DiningTable): TableInput {
  return {
    floor_area_id: table.floor_area_id,
    label: table.label,
    capacity: table.capacity,
    shape: table.shape,
    rotation: table.rotation,
    position_x: Number(table.position_x),
    position_y: Number(table.position_y),
  }
}

export function TableManager({ areas, layout, tables, onChanged }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingId = useRef<number | null>(null)
  const areaDrag = useRef<{ area: FloorArea, mode: 'move' | 'resize', startX: number, startY: number } | null>(null)
  const draftBoundsRef = useRef<Bounds | null>(null)
  const draftPositionRef = useRef<Position | null>(null)
  const entranceDrag = useRef<{ initial: EntrancePosition, current: EntrancePosition, grabX: number, grabY: number } | null>(null)
  const [draftPosition, setDraftPosition] = useState<Position | null>(null)
  const [draftBounds, setDraftBounds] = useState<Bounds | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(areas[0]?.id ?? null)
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [areaEditingId, setAreaEditingId] = useState<number | null>(null)
  const [areaName, setAreaName] = useState('')
  const [areaOrder, setAreaOrder] = useState('0')
  const [areaX, setAreaX] = useState('65')
  const [areaY, setAreaY] = useState('0')
  const [areaWidth, setAreaWidth] = useState('35')
  const [areaHeight, setAreaHeight] = useState('100')
  const [entranceX, setEntranceX] = useState(layout.entrance_x)
  const [entranceY, setEntranceY] = useState(layout.entrance_y)
  const [tableId, setTableId] = useState<number | null>(null)
  const [tableAreaId, setTableAreaId] = useState(String(areas[0]?.id ?? ''))
  const [label, setLabel] = useState('')
  const [capacity, setCapacity] = useState('2')
  const [shape, setShape] = useState<TableInput['shape']>('round')
  const [rotation, setRotation] = useState<DiningTable['rotation']>(0)
  const [positionX, setPositionX] = useState('10')
  const [positionY, setPositionY] = useState('10')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedArea = areas.find((area) => area.id === selectedAreaId)
  const visibleTables = tables

  function resetTableForm(areaId = selectedAreaId) {
    setTableId(null)
    setTableAreaId(String(areaId ?? ''))
    setLabel('')
    setCapacity('2')
    setShape('round')
    setRotation(0)
    setPositionX('10')
    setPositionY('10')
  }

  function editTable(table: DiningTable) {
    setSelectedAreaId(table.floor_area_id)
    setTableId(table.id)
    setTableAreaId(String(table.floor_area_id))
    setLabel(table.label)
    setCapacity(String(table.capacity))
    setShape(table.shape)
    setRotation(table.rotation)
    setPositionX(table.position_x)
    setPositionY(table.position_y)
    setError('')
    setMessage('')
  }

  function openAreaForm(area?: FloorArea) {
    setAreaEditingId(area?.id ?? null)
    setAreaName(area?.name ?? '')
    setAreaOrder(String(area?.sort_order ?? areas.length))
    setAreaX(area?.position_x ?? '65')
    setAreaY(area?.position_y ?? '0')
    setAreaWidth(area?.width ?? '35')
    setAreaHeight(area?.height ?? '100')
    setShowAreaForm(true)
    setError('')
    setMessage('')
  }

  async function saveArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await api.saveArea({
        name: areaName.trim(), sort_order: Number(areaOrder),
        position_x: Number(areaX), position_y: Number(areaY),
        width: Number(areaWidth), height: Number(areaHeight),
      }, areaEditingId ?? undefined)
      await onChanged()
      setSelectedAreaId(saved.id)
      resetTableForm(saved.id)
      setShowAreaForm(false)
      setMessage('Area saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save area.')
    } finally {
      setBusy(false)
    }
  }

  async function removeArea(area: FloorArea) {
    if (!window.confirm(`Delete ${area.name}? Move or remove its tables first.`)) return
    setBusy(true)
    setError('')
    try {
      await api.deleteArea(area.id)
      await onChanged()
      const fallbackArea = areas.find((candidate) => candidate.id !== area.id)
      setSelectedAreaId(fallbackArea?.id ?? null)
      resetTableForm(fallbackArea?.id ?? null)
      setMessage('Area deleted.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete area.')
    } finally {
      setBusy(false)
    }
  }

  async function saveTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await api.saveTable({
        floor_area_id: Number(tableAreaId),
        label: label.trim(),
        capacity: Number(capacity),
        shape,
        rotation,
        position_x: Number(positionX),
        position_y: Number(positionY),
      }, tableId ?? undefined)
      await onChanged()
      setSelectedAreaId(saved.floor_area_id)
      resetTableForm(saved.floor_area_id)
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
      if (tableId === table.id) resetTableForm()
      setMessage('Table deleted.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete table.')
    } finally {
      setBusy(false)
    }
  }

  async function rotateSavedTable(table: DiningTable) {
    setBusy(true)
    setError('')
    try {
      const updated = await api.saveTable({ ...tableInput(table), rotation: nextRotation(table.rotation) }, table.id)
      await onChanged()
      if (tableId === table.id) setRotation(updated.rotation)
      setMessage(`${table.label} rotated to ${updated.rotation}°.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not rotate table.')
    } finally {
      setBusy(false)
    }
  }

  async function persistEntrance(position: EntrancePosition, rollback?: EntrancePosition) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveLayout({ entrance_x: position.x, entrance_y: position.y })
      await onChanged()
      setMessage('Entrance saved.')
    } catch (caught) {
      if (rollback) {
        setEntranceX(rollback.x)
        setEntranceY(rollback.y)
      }
      setError(caught instanceof Error ? caught.message : 'Could not save entrance.')
    } finally {
      setBusy(false)
    }
  }

  function saveEntrance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persistEntrance({ x: entranceX, y: entranceY })
  }

  function beginEntranceDrag(event: PointerEvent<HTMLButtonElement>) {
    if (busy) return
    const position = { x: entranceX, y: entranceY }
    const marker = event.currentTarget.getBoundingClientRect()
    entranceDrag.current = {
      initial: position,
      current: position,
      grabX: event.clientX - marker.left - marker.width / 2,
      grabY: event.clientY - marker.top - marker.height / 2,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveEntranceDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!entranceDrag.current || !boardRef.current) return
    const board = boardRef.current.getBoundingClientRect()
    const marker = event.currentTarget.getBoundingClientRect()
    const halfWidth = marker.width / 2
    const halfHeight = marker.height / 2
    const centerX = Math.max(halfWidth, Math.min(board.width - halfWidth, event.clientX - board.left - entranceDrag.current.grabX))
    const centerY = Math.max(halfHeight, Math.min(board.height - halfHeight, event.clientY - board.top - entranceDrag.current.grabY))
    const next = {
      x: String(Math.round(centerX / board.width * 10000) / 100),
      y: String(Math.round(centerY / board.height * 10000) / 100),
    }
    entranceDrag.current.current = next
    setEntranceX(next.x)
    setEntranceY(next.y)
  }

  function endEntranceDrag() {
    const drag = entranceDrag.current
    entranceDrag.current = null
    if (!drag || (drag.current.x === drag.initial.x && drag.current.y === drag.initial.y)) return
    void persistEntrance(drag.current, drag.initial)
  }

  function cancelEntranceDrag() {
    if (entranceDrag.current) {
      setEntranceX(entranceDrag.current.initial.x)
      setEntranceY(entranceDrag.current.initial.y)
    }
    entranceDrag.current = null
  }

  function beginAreaDrag(event: PointerEvent<HTMLElement>, area: FloorArea, mode: 'move' | 'resize') {
    if (busy) return
    setSelectedAreaId(area.id)
    resetTableForm(area.id)
    areaDrag.current = { area, mode, startX: event.clientX, startY: event.clientY }
    draftBoundsRef.current = areaBounds(area)
    setDraftBounds(draftBoundsRef.current)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveAreaDrag(event: PointerEvent<HTMLElement>) {
    if (!areaDrag.current || !boardRef.current) return
    const { area, mode, startX, startY } = areaDrag.current
    const initial = areaBounds(area)
    const board = boardRef.current.getBoundingClientRect()
    const dx = Math.round(((event.clientX - startX) / board.width) * 100)
    const dy = Math.round(((event.clientY - startY) / board.height) * 100)
    if (mode === 'move') {
      draftBoundsRef.current = { ...initial, x: Math.max(0, Math.min(100 - initial.width, initial.x + dx)), y: Math.max(0, Math.min(100 - initial.height, initial.y + dy)) }
    } else {
      draftBoundsRef.current = { ...initial, width: Math.max(10, Math.min(100 - initial.x, initial.width + dx)), height: Math.max(10, Math.min(100 - initial.y, initial.height + dy)) }
    }
    setDraftBounds(draftBoundsRef.current)
  }

  async function endAreaDrag() {
    const nextBounds = draftBoundsRef.current
    if (!areaDrag.current || !nextBounds) return
    const { area } = areaDrag.current
    areaDrag.current = null
    if (nextBounds.x === Number(area.position_x) && nextBounds.y === Number(area.position_y) && nextBounds.width === Number(area.width) && nextBounds.height === Number(area.height)) {
      setDraftBounds(null)
      draftBoundsRef.current = null
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.saveArea({ name: area.name, sort_order: area.sort_order, position_x: nextBounds.x, position_y: nextBounds.y, width: nextBounds.width, height: nextBounds.height }, area.id)
      await onChanged()
      setMessage(`${area.name} layout saved.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not move area.')
    } finally {
      setDraftBounds(null)
      draftBoundsRef.current = null
      setBusy(false)
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, table: DiningTable) {
    if (busy) return
    editTable(table)
    draggingId.current = table.id
    draftPositionRef.current = null
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>, table: DiningTable) {
    if (draggingId.current !== table.id || !boardRef.current) return
    const zone = event.currentTarget.parentElement
    if (!zone) return
    const bounds = zone.getBoundingClientRect()
    const footprint = tableFootprint(table.shape, table.rotation)
    const maxX = Math.min(90, Math.max(0, (1 - footprint.width / bounds.width) * 100))
    const maxY = Math.min(90, Math.max(0, (1 - footprint.height / bounds.height) * 100))
    const x = Math.max(0, Math.min(maxX, Math.round(((event.clientX - bounds.left - footprint.width / 2) / bounds.width) * 100)))
    const y = Math.max(0, Math.min(maxY, Math.round(((event.clientY - bounds.top - footprint.height / 2) / bounds.height) * 100)))
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
      await api.saveTable({ ...tableInput(table), position_x: position.x, position_y: position.y }, table.id)
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
        <p>Design one floor plan with Indoor, Outdoor, and any other areas you need.</p>
      </div>
      {error && <div className="notice error-message" role="alert">{error}</div>}
      {message && <div className="notice success-message" role="status">{message}</div>}

      <section className="panel area-panel" aria-label="Floor areas">
        <div className="area-tabs"><strong>Design areas</strong><button type="button" className="area-add" onClick={() => openAreaForm()}>+ Add area</button></div>
        <div className="area-summary">{areas.map((area) => <button key={area.id} type="button" className={selectedAreaId === area.id ? 'active' : ''} onClick={() => { setSelectedAreaId(area.id); resetTableForm(area.id) }}>{area.name} <small>{tables.filter((table) => table.floor_area_id === area.id).length} tables</small></button>)}</div>
        {selectedArea && !showAreaForm && <div className="area-toolbar"><span>{selectedArea.name} selected · drag open space to move, or the corner to resize</span><div><button type="button" onClick={() => openAreaForm(selectedArea)}>Edit size & position</button><button type="button" disabled={areas.length === 1 || busy} onClick={() => void removeArea(selectedArea)}>Delete area</button></div></div>}
        {showAreaForm && (
          <form className="area-form" onSubmit={(event) => void saveArea(event)}>
            <label className="field">Area name<input value={areaName} onChange={(event) => setAreaName(event.target.value)} required maxLength={255} placeholder="e.g. Terrace" /></label>
            <label className="field">Display order<input type="number" min="0" value={areaOrder} onChange={(event) => setAreaOrder(event.target.value)} required /></label>
            <label className="field">Left (%)<input type="number" min="0" max="90" value={areaX} onChange={(event) => setAreaX(event.target.value)} required /></label>
            <label className="field">Top (%)<input type="number" min="0" max="90" value={areaY} onChange={(event) => setAreaY(event.target.value)} required /></label>
            <label className="field">Width (%)<input type="number" min="10" max="100" value={areaWidth} onChange={(event) => setAreaWidth(event.target.value)} required /></label>
            <label className="field">Height (%)<input type="number" min="10" max="100" value={areaHeight} onChange={(event) => setAreaHeight(event.target.value)} required /></label>
            <Button type="submit" isDisabled={busy}>{areaEditingId ? 'Save area' : 'Add area'}</Button>
            <button type="button" className="text-button" onClick={() => setShowAreaForm(false)}>Cancel</button>
          </form>
        )}
        <form className="entrance-form" onSubmit={(event) => void saveEntrance(event)}>
          <span>Entrance · drag the marker anywhere on the floor plan</span>
          <label className="field">Left (%)<input type="number" min="0" max="100" step="0.01" value={entranceX} onChange={(event) => setEntranceX(event.target.value)} required /></label>
          <label className="field">Top (%)<input type="number" min="0" max="100" step="0.01" value={entranceY} onChange={(event) => setEntranceY(event.target.value)} required /></label>
          <Button type="submit" isDisabled={busy}>Save entrance</Button>
        </form>
      </section>

      <div className="layout-grid">
        <section className="panel layout-panel">
          <div className="panel-heading"><h2>Whole floor <span className="count">{tables.length} tables</span></h2><small>Drag areas and tables to arrange</small></div>
          <div className="floor-board" ref={boardRef} aria-label="Combined restaurant floor plan">
            {areas.map((area) => {
              const bounds = draftBounds?.id === area.id ? draftBounds : areaBounds(area)
              return (
                <div
                  key={area.id}
                  className={`floor-zone${selectedAreaId === area.id ? ' active' : ''}`}
                  style={{ left: `${bounds.x}%`, top: `${bounds.y}%`, width: `${bounds.width}%`, height: `${bounds.height}%` }}
                  onPointerDown={(event) => {
                    if (event.target instanceof HTMLElement && event.target.closest('.floor-table, .zone-resize')) return
                    beginAreaDrag(event, area, 'move')
                  }}
                  onPointerMove={moveAreaDrag}
                  onPointerUp={() => void endAreaDrag()}
                  onPointerCancel={() => { areaDrag.current = null; draftBoundsRef.current = null; setDraftBounds(null) }}
                  onClick={() => setSelectedAreaId(area.id)}
                >
                  <span className="zone-heading">{area.name}</span>
                  {tables.filter((table) => table.floor_area_id === area.id).map((table) => {
                    const x = draftPosition?.id === table.id ? draftPosition.x : Number(table.position_x)
                    const y = draftPosition?.id === table.id ? draftPosition.y : Number(table.position_y)
                    const displayShape = tableId === table.id ? shape : table.shape
                    const displayRotation = tableId === table.id ? rotation : table.rotation
                    const footprint = tableFootprint(displayShape, displayRotation)
                    return (
                      <button
                        type="button"
                        key={table.id}
                        className={`floor-table shape-${displayShape} rotation-${displayRotation}${tableId === table.id ? ' selected' : ''}`}
                        style={{ left: `min(${x}%, calc(100% - ${footprint.width}px))`, top: `min(${y}%, calc(100% - ${footprint.height}px))` }}
                        onClick={(event) => { if (event.detail === 0) editTable(table) }}
                        onPointerDown={(event) => { setSelectedAreaId(area.id); handlePointerDown(event, table) }}
                        onPointerMove={(event) => handlePointerMove(event, table)}
                        onPointerUp={() => void handlePointerUp(table)}
                        onPointerCancel={() => { draggingId.current = null; draftPositionRef.current = null; setDraftPosition(null) }}
                        aria-label={`Table ${table.label}, ${table.capacity} seats, rotated ${displayRotation} degrees. Select to edit or drag to move.`}
                      >
                        <span className="orientation-marker" aria-hidden="true" />
                        <strong>{table.label}</strong><small>{table.capacity} seats</small>
                      </button>
                    )
                  })}
                  <button type="button" className="zone-resize" onPointerDown={(event) => { event.stopPropagation(); beginAreaDrag(event, area, 'resize') }} aria-label={`Resize ${area.name} area`} />
                </div>
              )
            })}
            <button type="button" className="entrance-label" style={{ left: `clamp(45px, ${entranceX}%, calc(100% - 45px))`, top: `clamp(15px, ${entranceY}%, calc(100% - 15px))` }} onPointerDown={beginEntranceDrag} onPointerMove={moveEntranceDrag} onPointerUp={endEntranceDrag} onPointerCancel={cancelEntranceDrag} aria-label="Drag entrance anywhere on the floor plan">ENTRANCE</button>
          </div>
        </section>
        <section className="panel table-editor">
          <div className="panel-heading"><h2>{tableId ? `Edit ${label}` : 'Add table'}</h2></div>
          <form className="compact-form" onSubmit={(event) => void saveTable(event)}>
            <label className="field">Table label<input value={label} onChange={(event) => setLabel(event.target.value)} required maxLength={50} placeholder="e.g. T4" /></label>
            <div className="form-grid">
              <label className="field">Area<select value={tableAreaId} onChange={(event) => setTableAreaId(event.target.value)} required>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
              <label className="field">Seats<input type="number" min="1" max="20" value={capacity} onChange={(event) => setCapacity(event.target.value)} required /></label>
              <label className="field">Shape<select value={shape} onChange={(event) => setShape(event.target.value as TableInput['shape'])}><option value="round">Round</option><option value="square">Square</option><option value="rectangle">Rectangle</option></select></label>
              <label className="field">Rotation<select value={rotation} onChange={(event) => setRotation(Number(event.target.value) as DiningTable['rotation'])}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label>
              <label className="field">X position (%)<input type="number" min="0" max="90" step="0.01" value={positionX} onChange={(event) => setPositionX(event.target.value)} required /></label>
              <label className="field">Y position (%)<input type="number" min="0" max="90" step="0.01" value={positionY} onChange={(event) => setPositionY(event.target.value)} required /></label>
            </div>
            <div className="rotation-preview"><div className={`preview-table shape-${shape} rotation-${rotation}`}><span className="orientation-marker" aria-hidden="true" />{label || 'Table'}</div><span>{shape === 'rectangle' ? (rotation === 90 || rotation === 270 ? 'Vertical' : 'Horizontal') : shape} · {rotation}°</span><button type="button" className="text-button" onClick={() => setRotation(nextRotation(rotation))}>Rotate 90°</button></div>
            <div className="form-actions"><Button type="submit" isDisabled={busy || areas.length === 0}>{tableId ? 'Save table' : 'Add table'}</Button>{tableId && <button type="button" className="text-button" onClick={() => resetTableForm()}>Cancel</button>}</div>
          </form>
          <div className="list-stack">
            {visibleTables.map((table) => (
              <div className="list-row" key={table.id}>
                <div><strong>{table.label}</strong><small>{areas.find((area) => area.id === table.floor_area_id)?.name ?? 'Area'} · {table.capacity} seats · {table.shape} · {table.rotation}°</small></div>
                <div className="row-actions"><button type="button" onClick={() => editTable(table)} disabled={busy}>Edit</button><button type="button" onClick={() => void rotateSavedTable(table)} disabled={busy}>Rotate</button><button type="button" onClick={() => void removeTable(table)} disabled={busy}>Delete</button></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
