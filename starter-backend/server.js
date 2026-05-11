import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { unknownEndpoint } from './middleware.js'
import eventsRouter from './routes/events.js'
import assignmentsRouter from './routes/assignments.js'

const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/events', eventsRouter)
app.use('/api/assignments', assignmentsRouter)

app.get('/message/hello', (req, res) => {
    res.send('SmartSched backend is running!')
})

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})