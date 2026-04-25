import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  increment,
  runTransaction,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const investmentsCollection = collection(db, 'investments');

export function subscribeToEscrowInvestments(callback) {
  const q = query(
    investmentsCollection,
    where('status', '==', 'escrow'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(null, data);
    },
    (error) => {
      console.error('Escrow investments subscription failed:', error);
      callback(error);
    }
  );
}

export function subscribeToAllInvestments(callback) {
  const q = query(investmentsCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(null, data);
    },
    (error) => {
      console.error('All investments subscription failed:', error);
      callback(error);
    }
  );
}

export async function releaseInvestment(investment) {
  const { id, amount, entrepreneurId, projectId } = investment;
  
  const investmentRef = doc(db, 'investments', id);
  const walletRef = doc(db, 'wallets', entrepreneurId);
  const projectRef = doc(db, 'pitches', projectId);

  // Using a transaction to ensure atomic updates
  await runTransaction(db, async (transaction) => {
    // 1. Update investment status
    transaction.update(investmentRef, {
      status: 'released',
      releasedAt: serverTimestamp()
    });

    // 2. Increment entrepreneur wallet balance
    transaction.update(walletRef, {
      balance: increment(amount)
    });

    // 3. Update project raisedAmount
    transaction.update(projectRef, {
      raisedAmount: increment(amount),
      updatedAt: serverTimestamp()
    });
  });
}
