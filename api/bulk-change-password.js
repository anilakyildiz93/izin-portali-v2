const { db, auth, requireAdmin } = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { new_password } = req.body || {};
    if (!new_password || String(new_password).trim().length < 6) {
      return res.status(400).json({ error: 'En az 6 karakterli yeni şifre gerekli.' });
    }
    const password = String(new_password).trim();

    const snap = await db.collection('profiles').where('role', '==', 'employee').get();
    const results = [];

    for (const doc of snap.docs) {
      const d = doc.data();
      try {
        await auth.updateUser(doc.id, { password });
        results.push({ registry_number: d.registryNumber || '-', success: true });
      } catch (err) {
        results.push({ registry_number: d.registryNumber || '-', success: false, error: err.message || 'Bilinmeyen hata' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return res.status(200).json({ successCount, total: results.length, results });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
