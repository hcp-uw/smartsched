import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { unknownEndpoint } from './middleware.js'
import eventsRouter from './routes/events.js'
import aiRouter from './routes/ai.js'

// create your express application
const app = express();

// enable json parsing
app.use(express.json());

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
    res.send(
        `Attention HCP Project Team! If you see this, your front end and
        back end are connected. Don't believe me? Upload and image and
        see for yourself!`
    )
})

app.post('/image/upload', (req, res) => {
    console.log(req.body);
    const base64ImgData = req.body.image;
    images.push(base64ImgData);
    res.status(201).send('Image uploaded');
})

app.get('/image/featured', (req, res) => {
    res.send(images);
})

// error handling
app.use(unknownEndpoint);

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