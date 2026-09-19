require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

(async () => {
  console.log('URI utilizada:', (process.env.MONGO_URI || '').replace(/:[^:@]+@/, ':***@'));
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const col = mongoose.connection.collection('solicitudes');
  const docs = await col.find().toArray();
  console.log('Total:', docs.length);
  docs.forEach(d => console.log(String(d._id), '|', d.estado, '|', d.categoria, '|', (d.titulo || '').slice(0, 30)));
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
