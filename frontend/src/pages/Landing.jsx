import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import styles from './Landing.module.css'

/* ── Data ──────────────────────────────────────────────────── */
const MODELS = [
  { name: 'k-Nearest Neighbours', short: 'kNN',  auc: 0.970, ca: 0.774, f1: 0.773, prec: 0.779, recall: 0.774, mcc: 0.750, best: true  },
  { name: 'Random Forest',         short: 'RF',   auc: 0.941, ca: 0.707, f1: 0.704, prec: 0.704, recall: 0.707, mcc: 0.675, best: false },
  { name: 'Logistic Regression',   short: 'LR',   auc: 0.939, ca: 0.665, f1: 0.661, prec: 0.659, recall: 0.665, mcc: 0.628, best: false },
  { name: 'Decision Tree',         short: 'Tree', auc: 0.796, ca: 0.591, f1: 0.592, prec: 0.594, recall: 0.591, mcc: 0.546, best: false },
]

const GENRES = ['blues','classical','country','disco','hiphop','jazz','metal','pop','reggae','rock']

const PIPELINE = [
  { step: '01', title: 'Dataset', desc: 'GTZAN — 1,000 audio clips across 10 genres, each 30 seconds at 22,050 Hz.' },
  { step: '02', title: 'Features', desc: 'MFCCs, chroma, spectral centroid, zero-crossing rate and mel-spectrogram statistics extracted via librosa.' },
  { step: '03', title: 'Normalisation', desc: 'StandardScaler applied to bring all features onto a comparable scale before training.' },
  { step: '04', title: 'Validation', desc: 'Stratified 10-fold cross-validation to produce reliable, unbiased performance estimates.' },
  { step: '05', title: 'CNN', desc: 'Mel spectrograms converted to 128×128 PNG images; a 4-block convolutional network with BatchNorm achieves the highest accuracy.' },
]

/* ── Scroll-reveal wrapper ─────────────────────────────────── */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Bar for metric value ──────────────────────────────────── */
function MetricBar({ value, best }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className={styles.barTrack}>
      <motion.div
        className={`${styles.barFill} ${best ? styles.barBest : ''}`}
        initial={{ width: 0 }}
        animate={inView ? { width: `${value * 100}%` } : {}}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  )
}

/* ── Component ─────────────────────────────────────────────── */
export default function Landing() {
  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroInner}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className={styles.eyebrow}>Music Information Retrieval</span>
          <h1 className={styles.heroTitle}>
            Classifying music<br />
            <em>genre from sound</em>
          </h1>
          <p className={styles.heroSub}>
            A comparative study of classical ML models and deep CNNs trained on
            the GTZAN benchmark — 1,000 clips, 10 genres, 10-fold validation.
          </p>
          <div className={styles.heroCta}>
            <Link to="/predict" className={styles.ctaPrimary}>
              Try the classifier →
            </Link>
            <a href="#models" className={styles.ctaSecondary}>
              See results
            </a>
          </div>
        </motion.div>

        {/* floating genre tags */}
        <div className={styles.genreTags} aria-hidden>
          {GENRES.map((g, i) => (
            <motion.span
              key={g}
              className={styles.genreTag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
            >
              {g}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── Dataset section ──────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHeader}>
              <span className={styles.pill}>Dataset</span>
              <h2 className={styles.sectionTitle}>GTZAN Genre Collection</h2>
            </div>
          </Reveal>

          <div className={styles.datasetGrid}>
            {[
              { num: '1,000', label: 'Audio Clips' },
              { num: '10',    label: 'Genre Classes' },
              { num: '30 s',  label: 'Per Clip' },
              { num: '22 kHz',label: 'Sample Rate' },
            ].map(({ num, label }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{num}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className={styles.bodyText}>
              The GTZAN dataset, introduced by Tzanetakis & Cook (2002), is the most widely used
              benchmark for music genre recognition. It consists of 100 clips per genre —{' '}
              {GENRES.join(', ')} — each 30 seconds long. Audio features are extracted using
              librosa: MFCCs (40 coefficients), chroma, spectral centroid, spectral bandwidth,
              zero-crossing rate, and log-mel spectrograms. Feature vectors are{' '}
              <strong>z-score normalised</strong> before any model sees them.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHeader}>
              <span className={styles.pill}>Methodology</span>
              <h2 className={styles.sectionTitle}>Training pipeline</h2>
            </div>
          </Reveal>

          <div className={styles.pipeline}>
            {PIPELINE.map(({ step, title, desc }, i) => (
              <Reveal key={step} delay={i * 0.07}>
                <div className={styles.pipelineItem}>
                  <span className={styles.pipelineStep}>{step}</span>
                  <div>
                    <h3 className={styles.pipelineTitle}>{title}</h3>
                    <p className={styles.pipelineDesc}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Model comparison ─────────────────────────────── */}
      <section id="models" className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHeader}>
              <span className={styles.pill}>Results</span>
              <h2 className={styles.sectionTitle}>Model comparison</h2>
              <p className={styles.sectionSub}>
                Stratified 10-fold cross-validation · feature-normalised inputs
              </p>
            </div>
          </Reveal>

          {/* metric cards */}
          <div className={styles.modelGrid}>
            {MODELS.map((m, i) => (
              <Reveal key={m.short} delay={i * 0.08}>
                <div className={`${styles.modelCard} ${m.best ? styles.modelBest : ''}`}>
                  {m.best && <span className={styles.bestBadge}>Best AUC</span>}
                  <div className={styles.modelHeader}>
                    <span className={styles.modelShort}>{m.short}</span>
                    <span className={styles.modelName}>{m.name}</span>
                  </div>
                  <div className={styles.aucRow}>
                    <span className={styles.aucLabel}>AUC</span>
                    <span className={styles.aucVal}>{m.auc.toFixed(3)}</span>
                  </div>
                  <MetricBar value={m.auc} best={m.best} />

                  <table className={styles.metricTable}>
                    <thead>
                      <tr>
                        {['CA','F1','Prec','Recall','MCC'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[m.ca, m.f1, m.prec, m.recall, m.mcc].map((v, j) => (
                          <td key={j}>{v.toFixed(3)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className={styles.bodyText} style={{ marginTop: '2rem' }}>
              kNN achieves the highest AUC of <strong>0.970</strong> and classification accuracy of{' '}
              <strong>77.4 %</strong>, outperforming Random Forest (AUC 0.941), Logistic Regression
              (0.939) and the Decision Tree (0.796). The CNN model — trained on mel-spectrogram images
              — is deployed in the classifier tab for end-to-end audio inference.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <Reveal>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to classify?</h2>
            <p className={styles.ctaSub}>Upload any .mp3 or .wav file and the CNN will predict its genre in seconds.</p>
            <Link to="/predict" className={styles.ctaPrimary}>
              Open classifier →
            </Link>
          </div>
        </Reveal>
      </section>

    </main>
  )
}
