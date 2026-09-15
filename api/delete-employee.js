const { db, auth, requireAdmin } = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'uid gerekli.' });

    const profileDoc = await db.collection('profiles').doc(uid).get();
    const registryNumber = profileDoc.exists ? profileDoc.data().registryNumber : null;

    try { await auth.deleteUser(uid); } catch (e) { /* Auth kaydı zaten yoksa yoksay */ }
    if (profileDoc.exists) await db.collection('profiles').doc(uid).delete();
    if (registryNumber) await db.collection('registryLookup').doc(String(registryNumber)).delete();

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
