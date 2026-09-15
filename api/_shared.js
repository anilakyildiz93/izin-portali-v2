const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

// İstekteki Authorization: Bearer <idToken> başlığını doğrular ve isteği
// yapan kullanıcının admin rolünde olduğunu kontrol eder. Değilse hata fırlatır.
async function requireAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    const err = new Error('Yetkisiz istek.');
    err.statusCode = 401;
    throw err;
  }
  const decoded = await auth.verifyIdToken(idToken);
  const profileDoc = await db.collection('profiles').doc(decoded.uid).get();
  if (!profileDoc.exists || profileDoc.data().role !== 'admin') {
    const err = new Error('Bu işlem için admin yetkisi gerekiyor.');
    err.statusCode = 403;
    throw err;
  }
  return { uid: decoded.uid, profile: profileDoc.data() };
}

// Sicil numarasından, gerçek bir e-posta adresi gerektirmeyen sahte bir
// e-posta üretir (Firebase Auth e-posta/şifre girişi istediği için).
function emailForRegistry(registryNumber) {
  return `sicil-${String(registryNumber).trim()}@line4.izinportali.local`;
}

function randomPassword() {
  return 'Aa' + Math.random().toString(36).slice(-8);
}

module.exports = { admin, db, auth, requireAdmin, emailForRegistry, randomPassword };
