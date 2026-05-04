import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { supabase } from './supabaseClient'
import './App.css'

const API_BASE = 'http://localhost:3001/api'

// ── Login Screen ──────────────────────────────────────────────
const LoginPage = () => {
    function loginWithGoogle() {
        supabase.auth.signInWithOAuth({ provider: 'google' })
    }

    return (
        <div style={styles.loginPage}>
            <div style={styles.loginCard}>
                <img src="/logo.png" alt="SmartSched" style={styles.loginLogo} />
                <h1 style={styles.loginTitle}>SmartSched</h1>
                <p style={styles.loginSubtitle}>Your AI-powered scheduling assistant</p>
                <button onClick={loginWithGoogle} style={styles.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    )
}

// ── Main App ──────────────────────────────────────────────────
const App = () => {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' })
    const [error, setError] = useState('')

    // Auth listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            setLoading(false)
        })
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    // Load events when session is ready
    useEffect(() => {
        if (!session) return
        async function loadEvents() {
            const token = session.access_token
            const res = await fetch(`${API_BASE}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setEvents(data.events || [])
        }
        loadEvents()
    }, [session])

    const handleDateClick = (info) => {
        setNewEvent({ title: '', start: info.dateStr + 'T09:00', end: info.dateStr + 'T10:00' })
        setShowModal(true)
    }

    const handleSubmit = async () => {
        if (!newEvent.title) { setError('Title is required'); return }
        const token = session.access_token
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(newEvent)
        })
        const data = await res.json()
        setEvents(prev => [...prev, data.event])
        setShowModal(false)
        setError('')
    }

    const handleDelete = async (clickInfo) => {
        if (!confirm(`Delete "${clickInfo.event.title}"?`)) return
        const token = session.access_token
        await fetch(`${API_BASE}/events/${clickInfo.event.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id))
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setEvents([])
    }

    if (loading) return <div style={styles.loading}>Loading...</div>
    if (!session) return <LoginPage />

    return (
        <div style={styles.appShell}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarTop}>
                    <img src="/logo.png" alt="SmartSched" style={styles.sidebarLogo} />
                    <span style={styles.sidebarTitle}>SmartSched</span>
                </div>

                <nav style={styles.nav}>
                    <button style={styles.navBtn}>📅 Calendar</button>
                    <button style={styles.navBtn}>✅ Assignments</button>
                    <button style={styles.navBtn}>📚 Classes</button>
                    {/* AI feature placeholder — coming soon */}
                    <button style={{ ...styles.navBtn, ...styles.navBtnDisabled }} disabled>
                        ✨ AI Schedule <span style={styles.badge}>Soon</span>
                    </button>
                </nav>

                <div style={styles.sidebarBottom}>
                    <span style={styles.userEmail}>{session.user.email}</span>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
                </div>
            </aside>

            {/* Main content */}
            <main style={styles.main}>
                <div style={styles.topBar}>
                    <h2 style={styles.pageTitle}>My Calendar</h2>
                    <button onClick={() => setShowModal(true)} style={styles.addBtn}>+ Add Event</button>
                </div>

                <div style={styles.calendarWrap}>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        dateClick={handleDateClick}
                        eventClick={handleDelete}
                        height="100%"
                    />
                </div>
            </main>

            {/* Add Event Modal */}
            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h2 style={{ margin: '0 0 16px' }}>Add Event</h2>
                        {error && <p style={{ color: 'red', margin: '0 0 8px' }}>{error}</p>}
                        <input placeholder="Title" value={newEvent.title}
                               onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                               style={styles.input} />
                        <label style={styles.label}>Start</label>
                        <input type="datetime-local" value={newEvent.start}
                               onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
                               style={styles.input} />
                        <label style={styles.label}>End</label>
                        <input type="datetime-local" value={newEvent.end}
                               onChange={e => setNewEvent({ ...newEvent, end: e.target.value })}
                               style={styles.input} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button onClick={handleSubmit} style={styles.addBtn}>Add</button>
                            <button onClick={() => { setShowModal(false); setError('') }} style={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
    loginPage: {
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0f0f1a'
    },
    loginCard: {
        background: '#1a1a2e', borderRadius: 16, padding: '48px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 340
    },
    loginLogo: { width: 72, height: 72, objectFit: 'contain' },
    loginTitle: { color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 },
    loginSubtitle: { color: '#888', fontSize: 14, margin: 0, textAlign: 'center' },
    googleBtn: {
        display: 'flex', alignItems: 'center', marginTop: 16,
        background: '#fff', color: '#333', border: 'none', borderRadius: 8,
        padding: '12px 24px', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', width: '100%', justifyContent: 'center'
    },
    appShell: {
        display: 'flex', height: '100vh', overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif', background: '#f5f5f7'
    },
    sidebar: {
        width: 220, background: '#1a1a2e', display: 'flex',
        flexDirection: 'column', padding: '20px 0', flexShrink: 0
    },
    sidebarTop: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 20px 24px', borderBottom: '1px solid #2a2a3e'
    },
    sidebarLogo: { width: 32, height: 32, objectFit: 'contain' },
    sidebarTitle: { color: '#fff', fontWeight: 700, fontSize: 16 },
    nav: { display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: 4, flex: 1 },
    navBtn: {
        background: 'transparent', border: 'none', color: '#ccc',
        textAlign: 'left', padding: '10px 12px', borderRadius: 8,
        cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
    },
    navBtnDisabled: { opacity: 0.5, cursor: 'default' },
    badge: {
        marginLeft: 'auto', background: '#7c3aed', color: '#fff',
        fontSize: 10, padding: '2px 6px', borderRadius: 4
    },
    sidebarBottom: {
        padding: '16px 20px', borderTop: '1px solid #2a2a3e',
        display: 'flex', flexDirection: 'column', gap: 8
    },
    userEmail: { color: '#888', fontSize: 12, wordBreak: 'break-all' },
    logoutBtn: {
        background: 'transparent', border: '1px solid #444', color: '#aaa',
        borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e5e5e5'
    },
    pageTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
    calendarWrap: { flex: 1, padding: 24, overflow: 'auto' },
    addBtn: {
        background: '#7c3aed', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
        fontSize: 14, fontWeight: 600
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        background: '#fff', padding: 28, borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 8, minWidth: 320,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    },
    input: {
        padding: '10px 12px', fontSize: 14, borderRadius: 8,
        border: '1px solid #ddd', outline: 'none'
    },
    label: { fontSize: 13, color: '#555', marginTop: 4 },
    cancelBtn: {
        background: '#f5f5f5', color: '#333', border: 'none',
        borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14
    },
    loading: {
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, color: '#888'
    }
}

export default App