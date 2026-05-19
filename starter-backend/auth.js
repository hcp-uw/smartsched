const { httpError } = require('./calendar');
const { makeSupabaseAnonClient } = require('./supabaseClient');

function getBearerToken(req) {
  const header = req.get('authorization') || req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function requireUser() {
  const supabaseAnon = makeSupabaseAnonClient();

  return async (req, _res, next) => {
    try {
      const token = getBearerToken(req);
      if (!token) throw httpError(401, { error: 'unauthorized', message: 'Missing bearer token.' });

      const { data, error } = await supabaseAnon.auth.getUser(token);
      if (error || !data?.user) {
        throw httpError(401, { error: 'unauthorized', message: 'Invalid or expired token.' });
      }

      req.user = { id: data.user.id, email: data.user.email };
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireUser };

