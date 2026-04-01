import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>◈</span>
          <span>SoundLabel</span>
        </Link>

        <div className={styles.links}>
          <Link to="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>
            Research
          </Link>
          <Link to="/predict" className={`${styles.link} ${pathname === '/predict' ? styles.active : ''}`}>
            Classify
          </Link>
        </div>

        <button
          className={styles.themeBtn}
          onClick={toggle}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          <motion.span
            key={theme}
            initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.25 }}
          >
            {theme === 'dark' ? '☀' : '◑'}
          </motion.span>
        </button>
      </nav>
    </motion.header>
  )
}
