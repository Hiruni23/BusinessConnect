import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

function isUnread(item) {
  if (typeof item.read === 'boolean') {
    return !item.read;
  }

  if (typeof item.isRead === 'boolean') {
    return !item.isRead;
  }

  return true;
}

export default function NotificationBell({ routePath = '/notifications', color = '#111827', size = 24 }) {
  const [userId, setUserId] = useState(null);
  const [count, setCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const q = query(collection(db, 'notifications'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const unreadCount = snapshot.docs.reduce((total, item) => {
          return total + (isUnread(item.data()) ? 1 : 0);
        }, 0);

        setCount(unreadCount);
      },
      (error) => {
        console.error('Notification bell listener failed:', error);
        setCount(0);
      },
    );

    return unsubscribe;
  }, [userId]);

  const badgeText = useMemo(() => (count > 99 ? '99+' : String(count)), [count]);

  return (
    <TouchableOpacity onPress={() => router.push(routePath)} style={styles.touchArea}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-outline" size={size} color={color} />
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    padding: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
