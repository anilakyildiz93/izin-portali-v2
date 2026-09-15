const { auth, requireAdmin } = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { uid, new_password } = req.body || {};
    if (!uid || !new_password || String(new_password).trim().length < 6) {
      return res.status(400).json({ error: 'uid ve en az 6 karakterli yeni şifre gerekli.' });
    }
    await auth.updateUser(uid, { password: String(new_password).trim() });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
