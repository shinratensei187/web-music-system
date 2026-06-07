import React, { useState, useRef, useEffect } from "react"
import classes from "./PostFilter.module.css"
import arrowDown from "../../image/arrowDown.png"

/* ─────────────────────────────────────────────────────────
   Всі компоненти на рівні МОДУЛЯ — React не перемонтує їх
   при ре-рендері PostFilter, тому drag-стан зберігається
───────────────────────────────────────────────────────── */

function RangeSlider({ min, max, valueMin, valueMax, onMin, onMax, step = 1 }) {
  const trackRef    = useRef(null)
  const draggingRef = useRef(null)
  const [, forceUpdate] = useState(0)

  const vMinRef  = useRef(valueMin)
  const vMaxRef  = useRef(valueMax)
  const onMinRef = useRef(onMin)
  const onMaxRef = useRef(onMax)
  const minRef   = useRef(min)
  const maxRef   = useRef(max)
  const stepRef  = useRef(step)

  useEffect(() => { vMinRef.current  = valueMin }, [valueMin])
  useEffect(() => { vMaxRef.current  = valueMax }, [valueMax])
  useEffect(() => { onMinRef.current = onMin    }, [onMin])
  useEffect(() => { onMaxRef.current = onMax    }, [onMax])
  useEffect(() => { minRef.current   = min      }, [min])
  useEffect(() => { maxRef.current   = max      }, [max])
  useEffect(() => { stepRef.current  = step     }, [step])

  function calcValue(clientX) {
    const track = trackRef.current
    if (!track) return null
    const rect  = track.getBoundingClientRect()
    const pct   = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw   = minRef.current + pct * (maxRef.current - minRef.current)
    return Math.round(raw / stepRef.current) * stepRef.current
  }

  /* mousedown на треку — знаходимо найближчий thumb */
  function handleTrackDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const val = calcValue(clientX)
    if (val === null) return
    const dMin = Math.abs(val - vMinRef.current)
    const dMax = Math.abs(val - vMaxRef.current)
    if (dMin <= dMax) {
      const clamped = Math.min(Math.max(val, minRef.current), vMaxRef.current - stepRef.current)
      onMinRef.current(clamped)
      draggingRef.current = 'min'
    } else {
      const clamped = Math.max(Math.min(val, maxRef.current), vMinRef.current + stepRef.current)
      onMaxRef.current(clamped)
      draggingRef.current = 'max'
    }
    forceUpdate(n => n + 1)
  }

  /* mousedown на конкретному thumb */
  function startDrag(e, thumb) {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = thumb
    forceUpdate(n => n + 1)
  }

  /* document-level обробники — реєструємо ОДИН раз */
  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const val = calcValue(clientX)
      if (val === null) return
      if (draggingRef.current === 'min') {
        const clamped = Math.min(Math.max(val, minRef.current), vMaxRef.current - stepRef.current)
        onMinRef.current(clamped)
      } else {
        const clamped = Math.max(Math.min(val, maxRef.current), vMinRef.current + stepRef.current)
        onMaxRef.current(clamped)
      }
    }
    function onUp() {
      if (!draggingRef.current) return
      draggingRef.current = null
      forceUpdate(n => n + 1)
    }

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('mouseup',    onUp)
    document.addEventListener('touchmove',  onMove, { passive: false })
    document.addEventListener('touchend',   onUp)
    return () => {
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseup',    onUp)
      document.removeEventListener('touchmove',  onMove)
      document.removeEventListener('touchend',   onUp)
    }
  }, []) // порожній масив — реєструємо один раз при монтуванні

  const range    = max - min || 1
  const leftPct  = Math.max(0, Math.min(100, ((valueMin - min) / range) * 100))
  const rightPct = Math.max(0, Math.min(100, ((valueMax - min) / range) * 100))
  const isDraggingMin = draggingRef.current === 'min'
  const isDraggingMax = draggingRef.current === 'max'

  return (
    <div className={classes.rangeSlider}>
      <div
        ref={trackRef}
        className={classes.rangeTrack}
        onMouseDown={handleTrackDown}
        onTouchStart={handleTrackDown}
      >
        <div
          className={classes.rangeFill}
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
        />
        <div
          className={`${classes.rangeThumb} ${isDraggingMin ? classes.dragging : ''}`}
          style={{ left: `${leftPct}%` }}
          onMouseDown={e => startDrag(e, 'min')}
          onTouchStart={e => startDrag(e, 'min')}
        />
        <div
          className={`${classes.rangeThumb} ${isDraggingMax ? classes.dragging : ''}`}
          style={{ left: `${rightPct}%` }}
          onMouseDown={e => startDrag(e, 'max')}
          onTouchStart={e => startDrag(e, 'max')}
        />
      </div>
    </div>
  )
}

function FilterDropdown({ id, name, value, options, isApplied, openFilter, setOpenFilter, onChange }) {
  const isOpen = openFilter === id

  function getLabel() {
    return options.find(o => o.value === value)?.name
  }

  return (
    <div className={classes.filterItem}>
      <button
        type="button"
        className={[
          classes.filterButton,
          isOpen    ? classes.active              : '',
          isApplied ? classes.filterButtonApplied : '',
        ].join(' ')}
        onClick={() => setOpenFilter(isOpen ? null : id)}
      >
        <span>{getLabel()}</span>
        <img src={arrowDown} alt="" className={classes.arrow} />
      </button>

      {isOpen && (
        <div className={classes.dropdown}>
          {options.map(opt => (
            <button
              type="button"
              key={opt.value}
              className={value === opt.value
                ? `${classes.dropdownItem} ${classes.selected}`
                : classes.dropdownItem}
              onClick={() => { onChange(name, opt.value); setOpenFilter(null) }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RangeFilterItem({
  id, label, min, max, valueMin, valueMax, onMin, onMax,
  format, isApplied, step, openFilter, setOpenFilter,
}) {
  const isOpen   = openFilter === id
  const effMin   = valueMin ?? min
  const effMax   = valueMax ?? max
  const btnLabel = isApplied ? `${format(effMin)} — ${format(effMax)}` : label

  return (
    <div className={classes.filterItem}>
      <button
        type="button"
        className={[
          classes.filterButton,
          isOpen    ? classes.active              : '',
          isApplied ? classes.filterButtonApplied : '',
        ].join(' ')}
        onClick={() => setOpenFilter(isOpen ? null : id)}
      >
        <span>{btnLabel}</span>
        <img src={arrowDown} alt="" className={classes.arrow} />
      </button>

      {isOpen && (
        <div className={`${classes.dropdown} ${classes.rangeDropdown}`}>
          <RangeSlider
            min={min} max={max} step={step}
            valueMin={effMin} valueMax={effMax}
            onMin={onMin} onMax={onMax}
          />
          <div className={classes.rangeLabels}>
            <span>{format(effMin)}</span>
            <span>{format(effMax)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PostFilter
───────────────────────────────────────────────────────── */
export default function PostFilter({ filter, setFilter, priceBounds, bpmBounds }) {
  const [openFilter, setOpenFilter] = useState(null)
  const barRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const pb = priceBounds || { min: 0, max: 10000 }
  const bb = bpmBounds   || { min: 60, max: 200  }

  const sortOptions = [
    { value: 'new',       name: 'По новизні'       },
    { value: 'title',     name: 'По назві'          },
    { value: 'priceLow',  name: 'Спочатку дешевші' },
    { value: 'priceHigh', name: 'Спочатку дорожчі' },
    { value: 'bpm',       name: 'По темпу'          },
  ]

  const genreOptions = [
    { value: '',            name: 'Жанр'        },
    { value: 'Фонк',        name: 'Фонк'        },
    { value: 'Хіп-хоп',    name: 'Хіп-хоп'    },
    { value: 'Треп',        name: 'Треп'        },
    { value: 'Лоу-фай',    name: 'Лоу-фай'    },
    { value: 'Поп',         name: 'Поп'         },
    { value: 'Рок',         name: 'Рок'         },
    { value: 'Електроніка', name: 'Електроніка' },
    { value: 'Хаус',        name: 'Хаус'        },
    { value: 'Техно',       name: 'Техно'       },
    { value: 'R&B',         name: 'R&B'         },
  ]

  const keyOptions = [
    { value: '', name: 'Тональність' },
    ...['C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
        'Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm']
      .map(k => ({ value: k, name: k })),
  ]

  function handleChange(name, value) {
    setFilter(prev => ({ ...prev, [name]: value }))
  }

  function clearFilters() {
    setFilter({ sort: 'new', genre: '', priceMin: null, priceMax: null, bpmMin: null, bpmMax: null, key: '' })
    setOpenFilter(null)
  }

  return (
    <div ref={barRef} className={classes.filterBar}>

      <FilterDropdown
        id="sort" name="sort"
        value={filter.sort} options={sortOptions}
        isApplied={filter.sort !== 'new'}
        openFilter={openFilter} setOpenFilter={setOpenFilter}
        onChange={handleChange}
      />

      <FilterDropdown
        id="genre" name="genre"
        value={filter.genre} options={genreOptions}
        isApplied={!!filter.genre}
        openFilter={openFilter} setOpenFilter={setOpenFilter}
        onChange={handleChange}
      />

      <RangeFilterItem
        id="price" label="Ціна"
        min={pb.min} max={pb.max} step={1}
        valueMin={filter.priceMin} valueMax={filter.priceMax}
        onMin={v => setFilter(p => ({ ...p, priceMin: v }))}
        onMax={v => setFilter(p => ({ ...p, priceMax: v }))}
        format={v => `${Number(v).toLocaleString('uk-UA')} ₴`}
        isApplied={filter.priceMin !== null || filter.priceMax !== null}
        openFilter={openFilter} setOpenFilter={setOpenFilter}
      />

      <RangeFilterItem
        id="bpm" label="Темп"
        min={bb.min} max={bb.max} step={1}
        valueMin={filter.bpmMin} valueMax={filter.bpmMax}
        onMin={v => setFilter(p => ({ ...p, bpmMin: v }))}
        onMax={v => setFilter(p => ({ ...p, bpmMax: v }))}
        format={v => `${v} BPM`}
        isApplied={filter.bpmMin !== null || filter.bpmMax !== null}
        openFilter={openFilter} setOpenFilter={setOpenFilter}
      />

      <FilterDropdown
        id="key" name="key"
        value={filter.key} options={keyOptions}
        isApplied={!!filter.key}
        openFilter={openFilter} setOpenFilter={setOpenFilter}
        onChange={handleChange}
      />

      <button type="button" className={classes.clearBtn} onClick={clearFilters}>
        Скинути
      </button>

    </div>
  )
}
