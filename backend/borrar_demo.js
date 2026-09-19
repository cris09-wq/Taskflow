require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const ids = [
  '6aaa038b802344cd7ace7796',
  '6aa9a82af3fd439ca4b4cf43'
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const col = mongoose.connection.collection('solicitudes');
  const res = await col.deleteMany({ _id: { $in: ids.map(i => new mongoose.Types.ObjectId(i)) } });
  console.log('Eliminadas:', res.deletedCount);

  const total = await col.find().toArray();
  const resumen = total.reduce((a, s) => (a[s.estado] = (a[s.estado] || 0) + 1, a), {});
  console.log('Total restantes:', total.length, '->', JSON.stringify(resumen));
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
