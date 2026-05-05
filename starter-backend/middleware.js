import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'unknown endpoint' })
}

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) return res.status(401).json({ error: 'No token' })

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' })

  req.user = data.user
  next()
}


// event validation
export function validateEvent(req, res, next){
    const { title, start, end } = req.body;
    if (!title || !start || !end) {
        return res.status(400).json({
            error: "Event must include title, start, and end time"
        });
    }
    next();
}

// module.exports = { unknownEndpoint, validateEvent }
//
//     next()
// };

//module.exports = validateEvent;
