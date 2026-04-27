import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, StatusBar, Alert, TextInput, ScrollView, Dimensions, Platform } from 'react-native';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400";

export default function ManageProducts() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Tech');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "products"),
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddProduct = async () => {
    if (!name || !price || !imageUrl) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    try {
      const imgArray = imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
      await addDoc(collection(db, "products"), {
        name,
        price: parseFloat(price),
        description,
        imageUrl: imgArray[0] || '',
        images: imgArray,
        category,
        sellerId: user.uid,
        status: "pending", // Requires admin approval
        createdAt: serverTimestamp()
      });
      
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setShowAddForm(false);
      Alert.alert("Success", "Your innovation has been submitted for approval.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to add product.");
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert("Delete Innovation", "Are you sure you want to remove this product?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "products", id));
      }}
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }} 
        style={styles.productImage} 
        defaultSource={{ uri: PLACEHOLDER_IMAGE }}
      />
      <View style={styles.productInfo}>
        <View style={styles.cardHeader}>
           <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
           <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#DCFCE7' : '#FEF3C7' }]}>
              <Text style={[styles.statusText, { color: item.status === 'approved' ? '#10B981' : '#F59E0B' }]}>
                {item.status?.toUpperCase()}
              </Text>
           </View>
        </View>
        <Text style={styles.productPrice}>${item.price?.toLocaleString()}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.cardFooter}>
           <Text style={styles.categoryText}>{item.category}</Text>
           <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Marketplace Management</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
            <Ionicons name={showAddForm ? "close" : "add"} size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {showAddForm ? (
          <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>List New Innovation</Text>
            <Text style={styles.formSub}>Submit your product for platform-wide distribution.</Text>
            
            <View style={styles.inputWrapper}>
               <Text style={styles.label}>Product Name *</Text>
               <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Bio-Nano Battery" />
            </View>

            <View style={styles.row}>
               <View style={[styles.inputWrapper, { flex: 1, marginRight: 15 }]}>
                  <Text style={styles.label}>Price (USD) *</Text>
                  <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="99.00" keyboardType="numeric" />
               </View>
               <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Tech 💻, Food 🍔" />
               </View>
            </View>

            <View style={styles.inputWrapper}>
               <Text style={styles.label}>Image Gallery (Comma separated URLs) *</Text>
               <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} 
                  value={imageUrl} 
                  onChangeText={setImageUrl} 
                  placeholder="https://url1.com, https://url2.com..." 
                  multiline
               />
               <Text style={styles.helperText}>The first image will be used as the main thumbnail.</Text>
            </View>

            <View style={styles.inputWrapper}>
               <Text style={styles.label}>Description</Text>
               <TextInput 
                 style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} 
                 value={description} 
                 onChangeText={setDescription} 
                 placeholder="Describe the unique value of this innovation..." 
                 multiline 
               />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddProduct}>
               <LinearGradient colors={['#1E293B', '#334155']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Submit for Approval</Text>
               </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <View style={styles.statsBar}>
               <View style={styles.statMiniCard}>
                  <Text style={styles.statMiniLabel}>Listed</Text>
                  <Text style={styles.statMiniVal}>{products.length}</Text>
               </View>
               <View style={styles.statMiniCard}>
                  <Text style={styles.statMiniLabel}>Approved</Text>
                  <Text style={styles.statMiniVal}>{products.filter(p => p.status === 'approved').length}</Text>
               </View>
               <View style={styles.statMiniCard}>
                  <Text style={styles.statMiniLabel}>Pending</Text>
                  <Text style={styles.statMiniVal}>{products.filter(p => p.status === 'pending').length}</Text>
               </View>
            </View>

            {loading ? (
              <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={80} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>No products listed</Text>
                    <Text style={styles.emptySub}>Start scaling your innovation by adding your first product.</Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  addBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', elevation: 4 },

  statsBar: { flexDirection: 'row', paddingHorizontal: 24, justifyContent: 'space-between', marginBottom: 20 },
  statMiniCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 18, width: (width - 68) / 3, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  statMiniLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  statMiniVal: { fontSize: 18, fontWeight: '900', color: '#1E293B' },

  formContainer: { padding: 24, paddingBottom: 100 },
  formTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  formSub: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginBottom: 30, marginTop: 4 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B', fontWeight: '600' },
  row: { flexDirection: 'row' },
  submitBtn: { marginTop: 20, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  productCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 24, padding: 12, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, alignItems: 'center' },
  productImage: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#F1F5F9' },
  productInfo: { flex: 1, marginLeft: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  productPrice: { fontSize: 18, fontWeight: '900', color: '#6366F1', marginBottom: 4 },
  productDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryText: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 }
});
