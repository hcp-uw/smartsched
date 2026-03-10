// define middleware to handle requests made to unknown endpoint
const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'unknown endpoint' })
}

module.exports = { unknownEndpoint }

const validateEvent = (req, res, next) => {
    const { title, start, end } = req.body;

    if (!title || !start || !end) {
        return res.status(400).json({
            error: "Event must include title, start, and end time"
        });
    }

    next();
};

module.exports = validateEvent;