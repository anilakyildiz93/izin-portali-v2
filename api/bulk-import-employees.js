const { db, auth, requireAdmin, emailForRegistry, randomPassword } = require('./_shared');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const employees = (req.body && req.body.employees) || [];
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'Aktarılacak çalışan satırı bulunamadı.' });
    }

    const results = [];

    for (const b of employees) {
      const registryNumber = String(b.registry_number || '').trim();
      try {
        if (!registryNumber || !b.first_name || !b.last_name) {
          throw new Error('Eksik bilgi (sicil no / ad / soyad).');
        }

        const existing = await db.collection('registryLookup').doc(registryNumber).get();
        if (existing.exists) {
          throw new Error('Bu sicil no zaten kayıtlı.');
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
          role: 'employee',
          annualLeaveTotal: Number(b.annual_leave_total) || 0,
          annualLeaveUsed: 0,
          flexibleHoursStart: '',
          flexibleHoursEnd: '',
          flexibleWorkNote: '',
          flexTimeBalance: 0,
          deductedHoursBalance: 0,
          onSickLeave: false,
          sickLeaveEndDate: null,
          createdAt: new Date().toISOString()
        });

        await db.collection('registryLookup').doc(registryNumber).set({ email });

        results.push({ registry_number: registryNumber, success: true, password });
      } catch (err) {
        results.push({ registry_number: registryNumber || '-', success: false, error: err.message || 'Bilinmeyen hata' });
      }
    }

    return res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
