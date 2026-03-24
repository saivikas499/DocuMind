import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { dark } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [focused, setFocused] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.toggleTop}><ThemeToggle /></div>

      <div className={styles.wrapper}>
        <div className={styles.logo}>
          <div className={styles.logoIcon} style={{ color: dark ? '#111' : '#fff' }}>◈</div>
          <h1 className={styles.logoTitle}>DocuMind</h1>
          <p className={styles.logoSub}>{isSignUp ? 'Create your account' : 'Sign in to continue'}</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit}>
            {[
              { id: 'email', label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
              { id: 'password', label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' }
            ].map(field => (
              <div key={field.id} className={styles.fieldWrap}>
                <label className={`${styles.label} ${focused === field.id ? styles.labelFocused : ''}`}>
                  {field.label}
                </label>
                <input
                  className={styles.input}
                  type={field.type}
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  onFocus={() => setFocused(field.id)}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            {error && <div className={styles.errorBox}>{error}</div>}
            {message && <div className={styles.successBox}>{message}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className={styles.divider}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span
              className={styles.switchLink}
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}