import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import './App.css'
import { supabase } from './supabaseClient'

const API_BASE = 'http://localhost:3001/api'

const App = () => {
    const [events, setEvents] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' })
    const [error, setError] = useState('')

    const session = useAuth()

    // get supabase token
    async function getToken() {
        const { data } = await supabase.auth.getSession()
        return data.session?.access_token
    }

    // modified to get supabase token
    // useEffect(() => {
    //     async function loadEvents() {
    //         const token = await getToken()
    //         const res = await fetch(`${API_BASE}/events`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             }
    //         })
    //         const data = await res.json()
    //         setEvents(data.events || [])
    //     }
    //     loadEvents()
    // }, [])

    // modified from above to only load events after user is logged in
    // loading events
    async function loadEvents() {
    if (!currentSession) return

    const token = currentSession.access_token

    const res = await fetch(`${API_BASE}/events`, {
        headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    calendar.removeAllEvents()
    calendar.addEventSource(data.events || [])
    }


    const handleDateClick = (info) => {
        setNewEvent({ title: '', start: info.dateStr + 'T09:00', end: info.dateStr + 'T10:00' })
        setShowModal(true)
    }

    // const handleSubmit = async () => {
    //     if (!newEvent.title) { setError('Title is required'); return }
    //     const res = await fetch(`${API_BASE}/events`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(newEvent)
    //     })
    //     const data = await res.json()
    //     setEvents(prev => [...prev, data.event])
    //     setShowModal(false)
    //     setError('')
    // }

    // modified from above with supabase token
    // adding events (i think)
    const handleSubmit = async () => {
        if (!newEvent.title) {
            setError('Title is required')
            return
        }
        const token = await getToken()
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newEvent)
        })
        const data = await res.json()
        setEvents(prev => [...prev, data.event])
        setShowModal(false)
        setError('')
    }

    // const handleDelete = async (clickInfo) => {
    //     if (!confirm(`Delete "${clickInfo.event.title}"?`)) return
    //     await fetch(`${API_BASE}/events/${clickInfo.event.id}`, { method: 'DELETE' })
    //     setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id))
    // }

    // modified from above with supabase token
    // delete events (i think)
    const handleDelete = async (clickInfo) => {
        if (!confirm(`Delete "${clickInfo.event.title}"?`)) return

        const token = await getToken()
        await fetch(`${API_BASE}/events/${clickInfo.event.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id))
    }

    // google oauth
    function loginWithGoogle() {
        supabase.auth.signInWithOAuth({
            provider: 'google'
        })
    }

    // NOTE: might need for testing but commenting out for now
    // async function callBackend() {
    //     const { data } = await supabase.auth.getSession()
    //     const token = data.session?.access_token

    //     const res = await fetch(`${API_BASE}/events`, {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         }
    //     })

    //     const result = await res.json()
    //     console.log(result)
    // }

    // not sure how to add comments in html but the google login button only 
    // shows when logged out and the calendar only shows if someone is logged in
    return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
            <h1>SmartSched</h1>

            {!session && (
                <button onClick={loginWithGoogle}>Login with Google</button>
            )}
            
            {session && (
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
                height="80vh"
            />
            )}

            {showModal && (
                <div style={overlay}>
                    <div style={modal}>
                        <h2>Add Event</h2>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        <input
                            placeholder="Title"
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            style={input}
                        />
                        <label>Start</label>
                        <input type="datetime-local" value={newEvent.start}
                            onChange={e => setNewEvent({ ...newEvent, start: e.target.value })} style={input} />
                        <label>End</label>
                        <input type="datetime-local" value={newEvent.end}
                            onChange={e => setNewEvent({ ...newEvent, end: e.target.value })} style={input} />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={handleSubmit}>Add</button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
}
const modal = {
    background: 'white', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '300px'
}
const input = { padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }

export default App