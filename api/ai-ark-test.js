const {
  getUser,
  ensureWorkspace
} = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        ok: false,
        error: 'POST only'
      });
    }

    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Sign in again.'
      });
    }

    const membership = await ensureWorkspace(user);

    if (!membership?.workspace?.id) {
      return res.status(409).json({
        ok: false,
        error: 'Workspace unavailable.'
      });
    }

    const apiKey = process.env.AI_ARK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: 'AI Ark API key is not configured.'
      });
    }

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const response = await fetch(
      'https://api.ai-ark.com/api/developer-portal/v1/companies',
      {
        method: 'POST',
        headers: {
          'X-TOKEN': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body.filters || {})
      }
    );

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: 'AI Ark request failed.',
        status: response.status,
        details: data
      });
    }

    return res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    console.error('AI Ark test error', error);

    return res.status(500).json({
      ok: false,
      error: error.message || 'AI Ark test failed.'
    });
  }
};
