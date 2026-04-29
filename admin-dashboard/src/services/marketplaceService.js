import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy, 
  deleteDoc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const subscribeToProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(null, products);
  }, (error) => {
    callback(error);
  });
};

export const subscribeToOrders = (callback) => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(null, orders);
  }, (error) => {
    callback(error);
  });
};

export const updateProductStatus = async (productId, status) => {
  const ref = doc(db, "products", productId);
  return updateDoc(ref, { status });
};

export const updateProduct = async (productId, data) => {
  const ref = doc(db, "products", productId);
  return updateDoc(ref, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteProduct = async (productId) => {
  const ref = doc(db, "products", productId);
  return deleteDoc(ref);
};

export const updateOrderStatus = async (orderId, status) => {
  const ref = doc(db, "orders", orderId);
  return updateDoc(ref, { status });
};

export const addProduct = async (productData) => {
  return addDoc(collection(db, "products"), {
    ...productData,
    status: "approved",
    createdAt: serverTimestamp()
  });
};
