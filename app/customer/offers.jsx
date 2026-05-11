import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OffersScreen() {
  const router = useRouter();
  const { theme: T } = useTheme();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedOffers, setSavedOffers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const user = auth.currentUser;

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.8,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsMenuOpen(false));
  };

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Fetch user's profile data and saved offers
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setSavedOffers(userDoc.data()?.savedOffers || []);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();

    // Subscribe to active offers
    const q = query(
      collection(db, 'offers'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const offersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOffers(offersData.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)));
        setLoading(false);
      },
      (error) => {
        console.error('Offers listener failed:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSaveOffer = async (offerId) => {
    if (!user) return;

    try {
      if (savedOffers.includes(offerId)) {
        // Remove from saved
        const newSaved = savedOffers.filter((id) => id !== offerId);
        setSavedOffers(newSaved);
        await updateDoc(doc(db, 'users', user.uid), {
          savedOffers: newSaved,
        });
      } else {
        // Add to saved
        const newSaved = [...savedOffers, offerId];
        setSavedOffers(newSaved);
        await updateDoc(doc(db, 'users', user.uid), {
          savedOffers: newSaved,
        });
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      Alert.alert('Error', 'Could not save offer.');
    }
  };

  const handleClaimOffer = async (offerId, offerTitle) => {
    if (!user) return;

    try {
      // Add offer to user's claimed offers
      await updateDoc(doc(db, 'users', user.uid), {
        claimedOffers: arrayUnion({
          offerId,
          title: offerTitle,
          claimedAt: new Date().toISOString(),
        }),
      });

      Alert.alert('Success', `You've claimed "${offerTitle}"!`);
    } catch (err) {
      console.error('Error claiming offer:', err);
      Alert.alert('Error', 'Could not claim offer.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch saved offers
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setSavedOffers(userDoc.data()?.savedOffers || []);
      }
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderOfferCard = ({ item }) => {
    const isSaved = savedOffers.includes(item.id);
    const discountPercent = item.discountPercent || 0;
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();

    return (
      <View style={[styles.offerCard, isExpired && styles.expiredCard]}>
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.offerTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {discountPercent > 0 && (
              <View style={styles.badgeDiscount}>
                <Text style={styles.badgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <Text style={styles.offerDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {item.expiresAt && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.expiryText}>
                Expires {new Date(item.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isSaved && styles.actionBtnActive]}
              onPress={() => handleSaveOffer(item.id)}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? '#3B82F6' : '#94A3B8'}
              />
              <Text style={[styles.actionBtnText, isSaved && styles.actionBtnTextActive]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.claimBtn, isExpired && styles.claimBtnDisabled]}
              onPress={() => handleClaimOffer(item.id, item.title)}
              disabled={isExpired}
            >
              <Text style={styles.claimBtnText}>
                {isExpired ? 'Expired' : 'Claim'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={isExpired ? '#ccc' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: T?.bg || '#F8FAFC' }]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openMenu} style={styles.backBtn}>
            <Ionicons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offers & Deals</Text>
          <TouchableOpacity onPress={() => router.push('/customer/cart')} style={styles.backBtn}>
            <Ionicons name="cart-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="gift-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No Offers Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon for exclusive deals
            </Text>
          </View>
        ) : (
          <FlatList
            data={offers}
            renderItem={renderOfferCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </SafeAreaView>

      {isMenuOpen && (
        <Modal visible transparent animationType="none" onRequestClose={closeMenu}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}>
                <SideMenu
                  visible={isMenuOpen}
                  onClose={closeMenu}
                  userData={userData}
                  onLogout={async () => {
                    await signOut(auth);
                    closeMenu();
                    router.replace('/auth/login');
                  }}
                  router={router}
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  sideMenu: { width: width * 0.8, backgroundColor: '#fff', height: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  expiredCard: {
    opacity: 0.6,
    borderLeftColor: '#E2E8F0',
  },
  cardContent: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  offerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badgeDiscount: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  offerDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  actionBtnTextActive: {
    color: '#3B82F6',
  },
  claimBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
  },
  claimBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
