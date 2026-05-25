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
import { getFunctions, httpsCallable } from 'firebase/functions';
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
  const { id, amount } = investment;
  // Fallback to businessId if entrepreneurId is missing (from direct connections)
  const entrepreneurId = investment.entrepreneurId || investment.businessId;
  const projectId = investment.projectId || 'unknown';
  
  const investmentRef = doc(db, 'investments', id);
  
  // Using a transaction to ensure atomic updates
  await runTransaction(db, async (transaction) => {
    // 1. Update investment status
    transaction.update(investmentRef, {
      status: 'released',
      releasedAt: serverTimestamp()
    });

    // 2. Increment entrepreneur wallet balance (use set with merge in case wallet doesn't exist)
    if (entrepreneurId) {
      const walletRef = doc(db, 'wallets', entrepreneurId);
      transaction.set(walletRef, {
        balance: increment(amount),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // 3. Update project raisedAmount (only if valid pitch)
    if (projectId && projectId !== 'unknown') {
      const projectRef = doc(db, 'pitches', projectId);
      transaction.set(projectRef, {
        raisedAmount: increment(amount),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  });

  // After releasing and crediting the wallet, attempt to fund the user's Stripe Connect account
  try {
    const functions = getFunctions();
    const fundConnect = httpsCallable(functions, 'fundConnectAccount');
    await fundConnect({
      targetUserId: entrepreneurId,
      amountCents: Math.round(amount * 100),
      idempotencyKey: `release-${id}`,
      investmentId: id
    });
  } catch (err) {
    console.error('Failed to initiate transfer to connected account:', err?.message || err);
  }
}
