const crypto = require('crypto');

function httpError(status, body) {
  const err = new Error(body?.error || 'request_error');
  err.status = status;
  err.body = body || { error: 'request_error' };
  return err;
}

function isIsoDateTimeString(s) {
  if (typeof s !== 'string') return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(s);
}

function toMs(iso) {
  return new Date(iso).getTime();
}

function overlaps(aStartIso, aEndIso, bStartIso, bEndIso) {
  const a0 = toMs(aStartIso);
  const a1 = toMs(aEndIso);
  const b0 = toMs(bStartIso);
  const b1 = toMs(bEndIso);
  return a0 < b1 && b0 < a1;
}

function normalizeEventInput(input) {
  if (!input || typeof input !== 'object') {
    throw httpError(400, { error: 'invalid_event', message: 'Event must be an object.' });
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const start = input.start;
  const end = input.end;

  if (!title) throw httpError(400, { error: 'invalid_event', message: 'title is required.' });
  if (!isIsoDateTimeString(start)) throw httpError(400, { error: 'invalid_event', message: 'start must be an ISO datetime string.' });
  if (!isIsoDateTimeString(end)) throw httpError(400, { error: 'invalid_event', message: 'end must be an ISO datetime string.' });
  if (toMs(end) <= toMs(start)) throw httpError(400, { error: 'invalid_event', message: 'end must be after start.' });

  const out = {
    id: typeof input.id === 'string' && input.id ? input.id : crypto.randomUUID(),
    title,
    start,
    end,
    description: typeof input.description === 'string' ? input.description : '',
    location: typeof input.location === 'string' ? input.location : '',
    attendees: Array.isArray(input.attendees) ? input.attendees.filter(a => typeof a === 'string') : [],
    meta: input.meta && typeof input.meta === 'object' ? input.meta : {},
    createdAt: typeof input.createdAt === 'string' && isIsoDateTimeString(input.createdAt) ? input.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return out;
}

function applyPatch(existing, patch) {
  if (!patch || typeof patch !== 'object') {
    throw httpError(400, { error: 'invalid_patch', message: 'Patch must be an object.' });
  }

  const next = { ...existing };
  if (typeof patch.title === 'string') next.title = patch.title.trim();
  if (typeof patch.description === 'string') next.description = patch.description;
  if (typeof patch.location === 'string') next.location = patch.location;
  if (Array.isArray(patch.attendees)) next.attendees = patch.attendees.filter(a => typeof a === 'string');
  if (patch.meta && typeof patch.meta === 'object') next.meta = patch.meta;
  if (typeof patch.start === 'string') next.start = patch.start;
  if (typeof patch.end === 'string') next.end = patch.end;

  // Validate core invariants after applying patch
  if (!next.title) throw httpError(400, { error: 'invalid_event', message: 'title is required.' });
  if (!isIsoDateTimeString(next.start)) throw httpError(400, { error: 'invalid_event', message: 'start must be an ISO datetime string.' });
  if (!isIsoDateTimeString(next.end)) throw httpError(400, { error: 'invalid_event', message: 'end must be an ISO datetime string.' });
  if (toMs(next.end) <= toMs(next.start)) throw httpError(400, { error: 'invalid_event', message: 'end must be after start.' });

  next.updatedAt = new Date().toISOString();
  return next;
}

function getConflicts(candidate, events, ignoreEventId) {
  return events
    .filter(e => e.id !== ignoreEventId)
    .filter(e => overlaps(candidate.start, candidate.end, e.start, e.end))
    .map(e => ({ id: e.id, title: e.title, start: e.start, end: e.end }));
}

function filterByRange(events, fromIso, toIso) {
  let out = events;

  if (fromIso !== undefined) {
    if (!isIsoDateTimeString(fromIso)) throw httpError(400, { error: 'invalid_range', message: 'from must be an ISO datetime string.' });
    const fromMs = toMs(fromIso);
    out = out.filter(e => toMs(e.end) > fromMs);
  }

  if (toIso !== undefined) {
    if (!isIsoDateTimeString(toIso)) throw httpError(400, { error: 'invalid_range', message: 'to must be an ISO datetime string.' });
    const toMsVal = toMs(toIso);
    out = out.filter(e => toMs(e.start) < toMsVal);
  }

  return out;
}

module.exports = {
  httpError,
  normalizeEventInput,
  applyPatch,
  getConflicts,
  filterByRange,
  isIsoDateTimeString,
  overlaps,
};

