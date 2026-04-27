import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, StatusBar, Share, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400";

export default function ServiceDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  
  // Review State
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const snap = await getDoc(doc(db, "products", id));
          if (snap.exists()) {
            setProduct({ id: snap.id, ...snap.data() });
          }
        } catch (error) {
          console.error("Fetch Product Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();

      // Subscribe to reviews
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", id),
        orderBy("createdAt", "desc")
      );
      const unsub = onSnapshot(q, (snap) => {
        const revs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(revs);
      });

      return () => unsub();
    }
  }, [id]);

  const handleSubmitReview = async () => {
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      setComment("");
      setRating(5);
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Review Error:", error);
      alert("Failed to post review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !product) return;
    setAdding(true);
    try {
      const cartRef = doc(db, "cart", user.uid);
      const cartSnap = await getDoc(cartRef);
      
      let items = [];
      if (cartSnap.exists()) {
        items = cartSnap.data().items || [];
      }

      const existingItemIndex = items.findIndex(item => item.productId === product.id);
      if (existingItemIndex >= 0) {
        items[existingItemIndex].qty += qty;
      } else {
        items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.images?.[0] || product.imageUrl,
          qty: qty
        });
      }

      await setDoc(cartRef, { userId: user.uid, items }, { merge: true });
      alert("Added to your bag!");
    } catch (error) {
      console.error("Cart Error:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this innovation on BusinessConnect: ${product?.name}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* HERO IMAGE CAROUSEL */}
        <View style={styles.heroSection}>
          {product?.images && product.images.length > 0 ? (
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / width);
                setActiveImg(index);
              }}
              scrollEventThrottle={16}
            >
              {product.images.map((img, index) => (
                <Image 
                  key={index}
                  source={{ uri: img || PLACEHOLDER_IMAGE }} 
                  style={[styles.heroImage, { width: width }]} 
                  defaultSource={{ uri: PLACEHOLDER_IMAGE }}
                />
              ))}
            </ScrollView>
          ) : (
            <Image 
              source={{ uri: product?.imageUrl || PLACEHOLDER_IMAGE }} 
              style={styles.heroImage} 
              defaultSource={{ uri: PLACEHOLDER_IMAGE }}
            />
          )}
          
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(248,250,252,1)']} style={styles.heroGradient} />
          
          {product?.images && product.images.length > 1 && (
            <View style={styles.carouselDots}>
               {product.images.map((_, idx) => (
                 <View key={idx} style={[styles.dot, activeImg === idx && styles.dotActive]} />
               ))}
            </View>
          )}

          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
               <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                 <Ionicons name="share-outline" size={22} color="#FFF" />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => router.push('/customer/cart')} style={styles.headerBtn}>
                 <Ionicons name="bag-handle-outline" size={22} color="#FFF" />
               </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
           <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                 <Text style={styles.categoryText}>{product?.category?.toUpperCase() || 'INNOVATION'}</Text>
                 <Text style={styles.titleText}>{product?.name}</Text>
              </View>
              <Text style={styles.priceText}>${product?.price?.toLocaleString()}</Text>
           </View>

            {/* RATING SECTION */}
            <View style={styles.ratingRow}>
               <View style={styles.stars}>
                  {[1,2,3,4,5].map(i => (
                    <Ionicons 
                      key={i} 
                      name={i <= (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length || 5) ? "star" : "star-outline"} 
                      size={14} 
                      color="#F59E0B" 
                    />
                  ))}
               </View>
               <Text style={styles.ratingText}>
                 {reviews.length > 0 
                   ? `${(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} reviews)` 
                   : "5.0 (New Innovation)"}
               </Text>
            </View>

            {/* DESCRIPTION */}
            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Overview</Text>
               <Text style={styles.descriptionText}>{product?.description || "No description available for this service."}</Text>
            </View>

            {/* REVIEWS & COMMENTS SYSTEM */}
            <View style={styles.section}>
               <View style={styles.reviewHeader}>
                  <Text style={styles.sectionTitle}>Customer Feedback</Text>
                  <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
               </View>
               
               {/* POST A REVIEW */}
               <View style={styles.reviewInputCard}>
                  <Text style={styles.inputTitle}>Rate this innovation</Text>
                  <View style={styles.starPicker}>
                     {[1,2,3,4,5].map(i => (
                        <TouchableOpacity key={i} onPress={() => setRating(i)}>
                           <Ionicons 
                             name={i <= rating ? "star" : "star-outline"} 
                             size={28} 
                             color="#F59E0B" 
                           />
                        </TouchableOpacity>
                     ))}
                  </View>
                  <TextInput 
                    style={styles.commentInput}
                    placeholder="What did you think about this service?"
                    placeholderTextColor="#94A3B8"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.submitReviewBtn, !comment.trim() && { opacity: 0.5 }]} 
                    onPress={handleSubmitReview}
                    disabled={submitting || !comment.trim()}
                  >
                     <Text style={styles.submitReviewText}>{submitting ? "Posting..." : "Post Review"}</Text>
                  </TouchableOpacity>
               </View>

               {/* REVIEWS LIST */}
               <View style={styles.reviewsList}>
                  {reviews.length === 0 ? (
                    <View style={styles.emptyReviews}>
                       <Ionicons name="chatbubbles-outline" size={40} color="#CBD5E1" />
                       <Text style={styles.emptyText}>No reviews yet. Be the first to share your experience!</Text>
                    </View>
                  ) : (
                    reviews.map((rev) => (
                      <View key={rev.id} style={styles.reviewCard}>
                         <View style={styles.revHeader}>
                            <View style={styles.revUser}>
                               <View style={styles.revAvatar}><Text style={styles.revInitial}>{rev.userName?.charAt(0)}</Text></View>
                               <View>
                                  <Text style={styles.revName}>{rev.userName}</Text>
                                  <View style={styles.starsMini}>
                                     {[1,2,3,4,5].map(i => (
                                       <Ionicons key={i} name={i <= rev.rating ? "star" : "star-outline"} size={10} color="#F59E0B" />
                                     ))}
                                  </View>
                               </View>
                            </View>
                            <Text style={styles.revDate}>
                              {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </Text>
                         </View>
                         <Text style={styles.revComment}>{rev.comment}</Text>
                      </View>
                    ))
                  )}
               </View>
            </View>

           {/* FEATURES MOCK */}
           <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Specifications</Text>
              <View style={styles.featureGrid}>
                 <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
                    <Text style={styles.featureText}>Verified Source</Text>
                 </View>
                 <View style={styles.featureItem}>
                    <Ionicons name="flash-outline" size={20} color="#6366F1" />
                    <Text style={styles.featureText}>Fast Delivery</Text>
                 </View>
                 <View style={styles.featureItem}>
                    <Ionicons name="infinite-outline" size={20} color="#6366F1" />
                    <Text style={styles.featureText}>Lifetime Support</Text>
                 </View>
                 <View style={styles.featureItem}>
                    <Ionicons name="planet-outline" size={20} color="#6366F1" />
                    <Text style={styles.featureText}>Global Ready</Text>
                 </View>
              </View>
           </View>

           {/* QUANTITY SELECTOR */}
           <View style={styles.qtySection}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyControls}>
                 <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty-1))}>
                    <Ionicons name="remove" size={20} color="#1E293B" />
                 </TouchableOpacity>
                 <Text style={styles.qtyVal}>{qty}</Text>
                 <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty+1)}>
                    <Ionicons name="add" size={20} color="#1E293B" />
                 </TouchableOpacity>
              </View>
           </View>

           {/* PROVIDER MOCK */}
           <View style={styles.providerCard}>
              <Image source={{ uri: "https://i.pravatar.cc/100?u=tech" }} style={styles.providerImg} />
              <View style={{ flex: 1 }}>
                 <Text style={styles.providerName}>Innovation Hub Co.</Text>
                 <Text style={styles.providerSub}>Top Tier Silicon Provider</Text>
              </View>
              <TouchableOpacity style={styles.msgBtn}>
                 <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
              </TouchableOpacity>
           </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="light" style={styles.footer}>
         <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart} disabled={adding}>
            {adding ? (
               <ActivityIndicator color="#1E293B" />
            ) : (
               <>
                  <Ionicons name="bag-add-outline" size={24} color="#1E293B" />
                  <Text style={styles.cartBtnText}>Add to Bag</Text>
               </>
            )}
         </TouchableOpacity>
         <TouchableOpacity 
           style={styles.buyBtn} 
           onPress={() => router.push({ pathname: '/customer/checkout', params: { directId: product.id, qty } })}
         >
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.buyGradient}>
               <Text style={styles.buyBtnText}>Purchase Now</Text>
            </LinearGradient>
         </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingBottom: 150 },
  
  heroSection: { height: height * 0.45, position: 'relative' },
  heroImage: { height: '100%', resizeMode: 'cover' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  carouselDots: { position: 'absolute', bottom: 60, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6, zIndex: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFF', width: 20 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, zIndex: 20 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 10 },

  content: { paddingHorizontal: 24, marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: '#F8FAFC', paddingTop: 30 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryText: { fontSize: 12, fontWeight: '800', color: '#6366F1', letterSpacing: 1.5, marginBottom: 8 },
  titleText: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  priceText: { fontSize: 28, fontWeight: '900', color: '#1E293B' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  stars: { flexDirection: 'row', gap: 2, marginRight: 8 },
  ratingText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  section: { marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  featureText: { fontSize: 13, fontWeight: '700', color: '#475569', marginLeft: 8 },

  qtySection: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 20 },
  qtyLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 18, fontWeight: '900', color: '#1E293B' },

  providerCard: { marginTop: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  providerImg: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  providerName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  providerSub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  msgBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, gap: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  cartBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cartBtnText: { color: '#1E293B', fontWeight: '800', fontSize: 16 },
  buyBtn: { flex: 1.5, height: 60 },
  buyGradient: { height: '100%', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },

  // REVIEW SYSTEM STYLES
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  reviewCount: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
  reviewInputCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 20 },
  inputTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 10 },
  starPicker: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  commentInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, fontSize: 14, color: '#1E293B', height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
  submitReviewBtn: { backgroundColor: '#1E293B', paddingVertical: 14, borderRadius: 16, marginTop: 15, alignItems: 'center' },
  submitReviewText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  
  reviewsList: { gap: 15 },
  reviewCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  revUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  revAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  revInitial: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  revName: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  starsMini: { flexDirection: 'row', gap: 1 },
  revDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  revComment: { fontSize: 14, color: '#475569', lineHeight: 20 },
  
  emptyReviews: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }
});
