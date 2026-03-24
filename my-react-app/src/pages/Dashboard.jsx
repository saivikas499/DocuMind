import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { uploadPDFWithProgress } from '../lib/api'
import AuthGuard from '../components/AuthGuard'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'
import styles from './Dashboard.module.css'

const MAX_PARALLEL = 3

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [uploads, setUploads] = useState([])
  const [user, setUser] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { dark } = useTheme()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('documents').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  function updateUpload(id, patch) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
  }

  async function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) return
    const activeCount = uploads.filter(u => u.status === 'uploading').length
    const canAdd = MAX_PARALLEL - activeCount
    if (canAdd <= 0) { alert(`All ${MAX_PARALLEL} upload slots are busy.`); return }
    const newJobs = pdfFiles.slice(0, canAdd).map(file => ({
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: file.name, file, status: 'uploading', percent: 0
    }))
    setUploads(prev => [...prev, ...newJobs])
    newJobs.forEach(job => startUpload(job))
  }

  async function startUpload(job) {
    try {
      await uploadPDFWithProgress(job.file, (data) => {
        if (data.error) { updateUpload(job.id, { status: 'error', error: data.error }); return }
        updateUpload(job.id, { percent: data.percent || 0, ...(data.percent === 100 ? { status: 'done' } : {}) })
        if (data.percent === 100) {
          fetchDocuments()
          setTimeout(() => setUploads(prev => prev.filter(u => u.id !== job.id)), 2500)
        }
      }, job.id)
    } catch (err) {
      updateUpload(job.id, { status: 'error', error: err.message })
    }
  }

  async function handleDelete(e, docId) {
    e.stopPropagation()
    if (!window.confirm('Delete this document?')) return
    await supabase.from('chunks').delete().eq('document_id', docId)
    await supabase.from('documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const activeCount = uploads.filter(u => u.status === 'uploading').length
  const slotsAvailable = MAX_PARALLEL - activeCount

  return (
    <AuthGuard>
      <div className={styles.page}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoIcon}>◈</div>
            <span className={styles.sidebarLogoText}>DocuMind</span>
          </div>

          <button
            className={styles.uploadBtn}
            onClick={() => slotsAvailable > 0 && inputRef.current.click()}
            disabled={slotsAvailable === 0}
          >
            <span>+</span> Upload PDF
          </button>
          <input ref={inputRef} type="file" accept=".pdf" multiple
            onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />

          <p className={styles.sectionLabel}>Documents</p>
          <div className={styles.docList}>
            {documents.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 12px' }}>No documents yet</p>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className={styles.docItem} onClick={() => navigate(`/chat/${doc.id}`)}>
                  <span className={styles.docIcon}>◎</span>
                  <span className={styles.docName}>{doc.file_name.replace('.pdf', '')}</span>
                  <button className={styles.docDelete} onClick={e => handleDelete(e, doc.id)}>×</button>
                </div>
              ))
            )}
          </div>

          <div className={styles.sidebarBottom}>
            <div className={styles.sidebarActions}>
              <div className={styles.userAvatar}>{user?.email?.[0]?.toUpperCase()}</div>
              <span className={styles.userEmail}>{user?.email}</span>
              <ThemeToggle />
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <span>↪</span> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className={styles.main}>

          {/* Upload progress strip */}
          {uploads.length > 0 && (
            <div className={styles.uploadStrip}>
              {uploads.map(job => (
                <div key={job.id} className={styles.uploadRow}>
                  <span className={styles.uploadName}>{job.fileName}</span>
                  <div className={styles.uploadBarWrap}>
                    <div
                      className={`${styles.uploadBar} ${job.status === 'done' ? styles.uploadBarDone : ''} ${job.status === 'error' ? styles.uploadBarError : ''}`}
                      style={{ width: `${job.percent}%` }}
                    />
                  </div>
                  <span className={`${styles.uploadPct} ${job.status === 'done' ? styles.uploadPctDone : ''} ${job.status === 'error' ? styles.uploadPctError : ''}`}>
                    {job.status === 'done' ? '✓' : job.status === 'error' ? '✗' : `${job.percent}%`}
                  </span>
                  <button className={styles.uploadDismiss} onClick={() => setUploads(prev => prev.filter(u => u.id !== job.id))}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.content}>
            {documents.length === 0 && uploads.length === 0 ? (
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => inputRef.current.click()}
              >
                <div className={styles.dropIcon}>⬆</div>
                <h2 className={styles.dropTitle}>Drop a PDF to get started</h2>
                <p className={styles.dropSub}>
                  Or click to browse · <span className={styles.dropLink}>Up to {MAX_PARALLEL} files at once</span>
                </p>
              </div>
            ) : (
              <div
                className={styles.docsArea}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              >
                <div className={styles.docsHeader}>
                  <h2 className={styles.docsTitle}>Your Documents</h2>
                  <div className={styles.docsMeta}>
                    <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                    <span className={styles.slotsBadge}>{slotsAvailable}/{MAX_PARALLEL} slots free</span>
                  </div>
                </div>
                <div className={styles.grid}>
                  {documents.map((doc, i) => (
                    <div
                      key={doc.id}
                      className={styles.docCard}
                      style={{ animationDelay: `${i * 0.05}s` }}
                      onClick={() => navigate(`/chat/${doc.id}`)}
                    >
                      <div className={styles.docCardIcon}>◈</div>
                      <p className={styles.docCardName}>{doc.file_name.replace('.pdf', '')}</p>
                      <p className={styles.docCardDate}>
                        {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className={styles.docCardAction}>Open chat →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}