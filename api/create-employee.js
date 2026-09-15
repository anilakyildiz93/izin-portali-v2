const { db, auth, requireAdmin, emailForRegistry, randomPassword } = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const b = req.body || {};
    if (!b.registry_number || !b.first_name || !b.last_name) {
      return res.status(400).json({ error: 'Eksik bilgi: sicil no, ad ve soyad zorunlu.' });
    }
    const registryNumber = String(b.registry_number).trim();

    const existing = await db.collection('registryLookup').doc(registryNumber).get();
    if (existing.exists) {
      return res.status(400).json({ error: `Sicil No ${registryNumber} zaten kayıtlı.` });
    }

    const email = emailForRegistry(registryNumber);
    const password = (b.password && String(b.password).trim()) || randomPassword();

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${b.first_name} ${b.last_name}`
    });

    await db.collection('profiles').doc(userRecord.uid).set({
      email,
      registryNumber,
      firstName: b.first_name,
      lastName: b.last_name,
      department: b.department || '',
      role: b.role === 'admin' ? 'admin' : 'employee',
      annualLeaveTotal: Number(b.annual_leave_total) || 0,
      annualLeaveUsed: 0,
      flexibleHoursStart: '',
      flexibleHoursEnd: '',
      flexibleWorkNote: b.flexible_work_note || '',
      flexTimeBalance: Number(b.flex_time_balance) || 0,
      deductedHoursBalance: Number(b.deducted_hours_balance) || 0,
      onSickLeave: false,
      sickLeaveEndDate: null,
      createdAt: new Date().toISOString()
    });

    await db.collection('registryLookup').doc(registryNumber).set({ email });

    return res.status(200).json({ ok: true, uid: userRecord.uid, password });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
