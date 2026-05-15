import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = ["All", "Tech", "Bio", "Green", "Fin", "Space", "AI"];

export default function ExploreInnovations() {
  const router = useRouter();
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const q = query(
      collection(db, "pitches"),
      where("status", "==", "Open"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPitches(list);
      setLoading(false);
    }, (error) => {
      console.error("Explore pitches listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPitches = pitches.filter(p => 
    (selectedCategory === "All" || p.category === selectedCategory) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({ pathname: "/customer/innovation-details", params: { id: item.id } })}
    >
      <View style={styles.imageContainer}>
        <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']} style={styles.imageOverlay} />
        <View style={styles.itemBadge}>
          <Text style={styles.itemBadgeText}>{item.category || "Tech"}</Text>
        </View>
        <TouchableOpacity 
          style={styles.favBtn}
          onPress={(e) => { e.stopPropagation(); /* Favorite Logic */ }}
        >
          <Ionicons name="heart-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemPrice}>Stakes from $500</Text>
        <View style={styles.itemFooter}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
          <View style={styles.progressSmall}>
             <View style={[styles.progressFill, { width: '70%' }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER & SEARCH */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput 
              placeholder="Discover innovations..." 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES HORIZONTAL */}
        <View style={styles.categoriesContainer}>
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.categoryBtn, selectedCategory === item && styles.categoryBtnActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* RESULTS GRID */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList 
            data={filteredPitches}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyText}>No innovations match your search.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 15 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    height: 56 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  filterBtn: { padding: 5 },

  categoriesContainer: { marginVertical: 10 },
  categoryList: { paddingHorizontal: 24 },
  categoryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginRight: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  categoryText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  categoryTextActive: { color: '#FFF' },

  gridContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  itemCard: { width: (width - 48) / 2, margin: 8, backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  imageContainer: { height: 160, backgroundColor: '#F1F5F9', position: 'relative' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  itemBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  itemBadgeText: { fontSize: 10, fontWeight: '800', color: '#1E293B' },
  favBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  itemContent: { padding: 15 },
  itemTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  itemPrice: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 4 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginLeft: 4 },
  progressSmall: { width: 60, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600', marginTop: 20 }
});
