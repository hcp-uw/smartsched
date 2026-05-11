import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { unknownEndpoint } from './middleware.js'
import eventsRouter from './routes/events.js'
import assignmentsRouter from './routes/assignments.js'
import aiRouter from './routes/ai.js'

const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/events', eventsRouter)
app.use('/api/assignments', assignmentsRouter)

// enable cors
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use("/api/events", eventsRouter);
app.use("/api/ai", aiRouter);

// our 'database'. This is just a simple in-memory store for the images, and
// will be lost when the server is restarted. In a real application, you would
// use a database to store the images.
const images = [];

// test endpoint
app.get('/message/hello', (req, res) => {
    res.send('SmartSched backend is running!')
})

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
// set port to listen on
const PORT = process.env.PORT || 3001;

// start your server
const server = app.listen(PORT, () => {
    console.log(`Server running on port test ${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server closed');
    });
});
