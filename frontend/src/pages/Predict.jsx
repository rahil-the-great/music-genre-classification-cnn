import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Predict.module.css'

const GENRE_EMOJI = {
  blues:'🎸', classical:'🎻', country:'🤠', disco:'🪩',
  hiphop:'🎤', jazz:'🎷', metal:'🤘', pop:'⭐', reggae:'🌴', rock:'🔥'
}

const API = 'http://127.0.0.1:5001/predict'

/* ── Waveform decoration ───────────────────────────────── */
function Waveform({ active }) {
  const bars = Array.from({ length: 28 }, (_, i) => i)
  return (
    <div className={styles.waveform} aria-hidden>
      {bars.map(i => (
        <motion.span
          key={i}
          className={styles.waveBar}
          animate={active
            ? { scaleY: [0.3, Math.random() * 0.7 + 0.4, 0.3], opacity: [0.4, 1, 0.4] }
            : { scaleY: 0.3, opacity: 0.2 }
          }
          transition={active
            ? { repeat: Infinity, duration: 0.6 + Math.random() * 0.5, delay: i * 0.035 }
            : {}
          }
        />
      ))}
    </div>
  )
}

/* ── Confidence bar ────────────────────────────────────── */
function ConfBar({ genre, pct, max }) {
  const ref = useRef(null)
  const emoji = GENRE_EMOJI[genre.toLowerCase()] || '🎵'
  return (
    <div className={styles.confRow}>
      <span className={styles.confGenre}>{emoji} {genre}</span>
      <div className={styles.confTrack}>
        <motion.div
          className={styles.confFill}
          style={{ '--is-max': pct === max ? 1 : 0 }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className={styles.confPct}>{pct.toFixed(1)}%</span>
    </div>
  )
}

/* ── Drop zone ─────────────────────────────────────────── */
function DropZone({ onFile, disabled }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)

  const handle = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['mp3','wav'].includes(ext)) {
      alert('Please upload a .mp3 or .wav file.')
      return
    }
    onFile(file)
  }, [onFile])

  const onDrop = (e) => {
    e.preventDefault(); setOver(false)
    handle(e.dataTransfer.files[0])
  }

  return (
    <motion.div
      className={`${styles.dropZone} ${over ? styles.dropOver : ''} ${disabled ? styles.dropDisabled : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav"
        className={styles.hiddenInput}
        onChange={e => handle(e.target.files[0])}
        disabled={disabled}
      />
      <div className={styles.dropIcon}>
        {over ? '📂' : '🎵'}
      </div>
      <p className={styles.dropTitle}>
        {over ? 'Drop to analyse' : 'Upload audio file'}
      </p>
      <p className={styles.dropSub}>
        Drag & drop or <span className={styles.dropLink}>browse</span> — .mp3 or .wav
      </p>
    </motion.div>
  )
}

/* ── Main page ─────────────────────────────────────────── */
export default function Predict() {
  const [file, setFile]     = useState(null)
  const [status, setStatus] = useState('idle')   // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  const handleFile = useCallback(async (f) => {
    setFile(f)
    setStatus('loading')
    setResult(null)
    setErrMsg('')

    const fd = new FormData()
    fd.append('file', f)

    try {
      const res = await fetch(API, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setResult(data)
      setStatus('done')
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }, [])

  const reset = () => {
    setFile(null); setStatus('idle'); setResult(null); setErrMsg('')
  }

  // sort scores descending for display
  const sortedScores = result?.all_scores
    ? Object.entries(result.all_scores).sort((a, b) => b[1] - a[1])
    : []
  const maxScore = sortedScores[0]?.[1] ?? 0

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>CNN Classifier</span>
          <h1 className={styles.title}>Identify a genre</h1>
          <p className={styles.sub}>
            Upload any audio clip — the convolutional network analyses
            its mel spectrogram and returns a genre prediction.
          </p>
        </motion.div>

        {/* upload area */}
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <DropZone onFile={handleFile} disabled={false} />
              {status === 'error' && (
                <motion.p
                  className={styles.errorMsg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ⚠ {errMsg}
                </motion.p>
              )}
            </motion.div>

          ) : status === 'loading' ? (
            <motion.div
              key="loading"
              className={styles.loadingCard}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Waveform active />
              <p className={styles.loadingLabel}>Analysing <em>{file?.name}</em>…</p>
              <p className={styles.loadingSub}>Generating mel spectrogram and running inference</p>
            </motion.div>

          ) : status === 'done' ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* genre result */}
              <div className={styles.resultCard}>
                <span className={styles.resultEmoji}>
                  {GENRE_EMOJI[result.genre?.toLowerCase()] ?? '🎵'}
                </span>
                <div className={styles.resultMeta}>
                  <span className={styles.resultLabel}>Predicted Genre</span>
                  <span className={styles.resultGenre}>{result.genre}</span>
                  <span className={styles.resultConf}>{result.confidence}% confidence</span>
                </div>
              </div>

              {/* file info */}
              <div className={styles.fileInfo}>
                <span>📄 {file?.name}</span>
                <button className={styles.resetBtn} onClick={reset}>
                  ↩ Classify another
                </button>
              </div>

              {/* all scores */}
              <div className={styles.scoresCard}>
                <h3 className={styles.scoresTitle}>All genre scores</h3>
                <div className={styles.confList}>
                  {sortedScores.map(([genre, pct]) => (
                    <ConfBar key={genre} genre={genre} pct={pct} max={maxScore} />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </div>
    </main>
  )
}