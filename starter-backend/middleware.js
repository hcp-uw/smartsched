import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

export async function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'No token' })
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' })
        req.user = data.user
        next()
    } catch (error) {
        console.error('Auth Middleware Error:', error)
        res.status(500).json({ error: 'Internal server error in auth middleware' })
    }
}

export function unknownEndpoint(req, res) {
    res.status(404).send({ error: 'unknown endpoint' })
}

export function validateEvent(req, res, next) {
    const { title, start, end } = req.body
    if (!title || !start || !end) {
        return res.status(400).json({ error: 'Event must include title, start, and end time' })
    }
    next()
}