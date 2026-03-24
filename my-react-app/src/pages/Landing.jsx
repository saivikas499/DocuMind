import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import styles from './Landing.module.css'

const FEATURES = [
  { icon: '⬆', title: 'Upload any PDF', desc: 'Drop in research papers, books, contracts — any PDF works instantly.' },
  { icon: '◎', title: 'Semantic search', desc: 'AI understands meaning, not just keywords. Ask naturally.' },
  { icon: '◈', title: 'Instant answers', desc: 'Get accurate answers pulled directly from your document.' },
]

const MOCK_MSGS = [
  { role: 'user', text: 'What were the total revenues this year?' },
  { role: 'ai', text: 'Total revenues reached $4.2B, representing 18% YoY growth driven by the enterprise segment which grew 34%...' },
  { role: 'user', text: 'What are the main risk factors?' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { dark } = useTheme()

  return (
    <div className={styles.page}>
      <div className={styles.ambient} />

      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <div className={styles.navLogoIcon} style={{ color: dark ? '#111' : '#fff' }}>◈</div>
          <span className={styles.navLogoText}>DocuMind</span>
        </div>
        <div className={styles.navActions}>
          <ThemeToggle />
          <button className={styles.btnGhost} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.btnAccent} onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span className={styles.badgeText}>AI-powered document intelligence</span>
        </div>

        <h1 className={styles.heroTitle}>
          Ask anything about<br />
          <span className={styles.heroAccent}>any document</span>
        </h1>

        <p className={styles.heroSub}>
          Upload a PDF and have a conversation with it.
          Powered by semantic AI that understands meaning, not just words.
        </p>

        <div className={styles.heroActions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
            Start for free →
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

        <div className={styles.mockChat}>
          <div className={styles.mockChatBar}>
            <div className={styles.mockDots}>
              {['#f87171', '#fbbf24', '#34d399'].map(c => (
                <div key={c} className={styles.mockDot} style={{ background: c }} />
              ))}
            </div>
            <span className={styles.mockFileName}>annual-report-2024.pdf</span>
          </div>
          <div className={styles.mockMessages}>
            {MOCK_MSGS.map((msg, i) => (
              <div key={i}
                className={`${styles.mockMsg} ${msg.role === 'user' ? styles.mockMsgUser : styles.mockMsgAi}`}
                style={{ animationDelay: `${0.4 + i * 0.15}s` }}
              >
                <div className={`${styles.mockBubble} ${msg.role === 'user' ? styles.mockBubbleUser : styles.mockBubbleAi}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.features}>
        {FEATURES.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>© 2025 DocuMind — AI Document Intelligence</div>
    </div>
  )
}