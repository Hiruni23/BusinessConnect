const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkChats() {
  const snapshot = await db.collection('chats').limit(5).get();
  snapshot.forEach(doc => {
    console.log(`Chat ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

checkChats();
