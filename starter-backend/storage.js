const path = require('path');
const fs = require('fs/promises');

const DATA_PATH = path.join(__dirname, 'data', 'events.json');

async function readJsonFile() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return { events: [] };
  if (!Array.isArray(parsed.events)) return { events: [] };
  return parsed;
}

async function writeJsonFile(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function listEvents() {
  const data = await readJsonFile();
  return data.events;
}

async function putAllEvents(events) {
  await writeJsonFile({ events });
}

module.exports = { listEvents, putAllEvents };

