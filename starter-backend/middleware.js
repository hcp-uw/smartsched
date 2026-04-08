// supabase
import { supabase } from './lib/supabaseClient.js'

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) return res.status(401).json({ error: 'No token' })

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' })

  req.user = data.user
  next()
}

// define middleware to handle requests made to unknown endpoint
export function unknownEndpoint(req, res) {
    res.status(404).send({ error: 'unknown endpoint' })
}

//module.exports = { unknownEndpoint }

// event validation
export function validateEvent(req, res, next){
    const { title, start, end } = req.body;

    if (!title || !start || !end) {
        return res.status(400).json({
            error: "Event must include title, start, and end time"
        });
    }

    next()
};

//module.exports = validateEvent;