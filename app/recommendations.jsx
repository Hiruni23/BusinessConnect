import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function RecommendationsRedirect() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setTarget('/entrepreneur/recommendations');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = String(userDoc.data()?.role || '').toLowerCase();
        setTarget(role === 'investor' ? '/investor/recommendations' : '/entrepreneur/recommendations');
      } catch (error) {
        console.error('Error resolving recommendations route:', error);
        setTarget('/entrepreneur/recommendations');
      }
    });

    return unsubscribe;
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  return <Redirect href={target} />;
}
