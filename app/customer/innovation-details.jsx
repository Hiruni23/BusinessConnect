import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

export default function InnovationDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchPitch = async () => {
        try {
          const snap = await getDoc(doc(db, "pitches", id));
          if (snap.exists()) {
            setPitch({ id: snap.id, ...snap.data() });
          }
        } catch (error) {
          console.error("Fetch Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPitch();
    }
  }, [id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing innovation: ${pitch?.title} on BusinessConnect!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const startChat = async () => {
    if (!pitch || !user || !pitch.entrepreneurId) {
      console.error("Missing data for chat:", { pitch, user });
      return;
    }
    
    const chatId = `${pitch.id}_${user.uid}`;
    try {
      await setDoc(doc(db, "chats", chatId), {
        participants: [user.uid, pitch.entrepreneurId],
        customerName: user.displayName || user.email || "Customer",
        entrepreneurId: pitch.entrepreneurId,
        pitchId: pitch.id || id,
        pitchTitle: pitch.title || "Innovation",
        lastMessage: "Interested in your innovation!",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      router.push({
        pathname: `/chat/${chatId}`,
        params: { title: pitch.title || "Innovation", receiverName: "Innovator" },
      });
    } catch (error) {
      console.error("Chat Init Error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const raisedAmount = Number(pitch?.raisedAmount || 0);
  const fundingGoal = Number(pitch?.fundingGoal || 0);
  const progressPercent = fundingGoal > 0 ? Math.min((raisedAmount / fundingGoal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* HERO IMAGE SECTION */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: pitch?.imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600" }} 
            style={styles.heroImage} 
          />
          <LinearGradient 
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(248,250,252,1)']} 
            style={styles.heroGradient} 
          />
          
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.actionCircle}>
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCircle}>
                <Ionicons name="heart-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <BlurView intensity={30} tint="dark" style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{pitch?.category || "Innovation"}</Text>
            </BlurView>
            <Text style={styles.title}>{pitch?.title}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${raisedAmount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Raised</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.floor(progressPercent)}%</Text>
              <Text style={styles.statLabel}>Funded</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12d</Text>
              <Text style={styles.statLabel}>Left</Text>
            </View>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <LinearGradient 
                colors={['#6366F1', '#A855F7']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 0}}
                style={[styles.progressFill, { width: `${progressPercent}%` }]} 
              />
            </View>
            <Text style={styles.goalText}>Target: ${fundingGoal.toLocaleString()}</Text>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.description}>{pitch?.description}</Text>
          </View>

          {/* INNOVATION ROADMAP */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Roadmap</Text>
            <View style={styles.roadmapContainer}>
              <View style={styles.roadmapLine} />
              
              <View style={styles.roadmapItem}>
                <View style={[styles.roadmapDot, styles.dotCompleted]} />
                <View style={styles.roadmapContent}>
                  <Text style={styles.roadmapTitle}>Concept & Design</Text>
                  <Text style={styles.roadmapDate}>Jan 2026 • Completed</Text>
                </View>
              </View>

              <View style={styles.roadmapItem}>
                <View style={[styles.roadmapDot, styles.dotActive]} />
                <View style={styles.roadmapContent}>
                  <Text style={[styles.roadmapTitle, { color: '#4F46E5' }]}>Prototype Alpha</Text>
                  <Text style={styles.roadmapDate}>Currently in Development</Text>
                </View>
              </View>

              <View style={styles.roadmapItem}>
                <View style={styles.roadmapDot} />
                <View style={styles.roadmapContent}>
                  <Text style={styles.roadmapTitle}>Global Manufacturing</Text>
                  <Text style={styles.roadmapDate}>Scheduled for Sept 2026</Text>
                </View>
              </View>
            </View>
          </View>

          {/* COMMUNITY TALK */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Innovation Talk</Text>
              <Text style={styles.commentCount}>24 Comments</Text>
            </View>
            
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Image source={{ uri: "https://i.pravatar.cc/100?u=sarah" }} style={styles.commentAvatar} />
                <View>
                  <Text style={styles.commentUser}>Sarah Johnson</Text>
                  <Text style={styles.commentTime}>2h ago</Text>
                </View>
              </View>
              <Text style={styles.commentText}>The energy efficiency on this prototype is game-changing. Can't wait to see the final results!</Text>
            </View>

            <TouchableOpacity style={styles.addCommentBtn}>
              <Text style={styles.addCommentText}>Add your thoughts...</Text>
            </TouchableOpacity>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.arBtn}
              onPress={() => router.push({ pathname: "/customer/ar-view", params: { id: pitch.id, title: pitch.title } })}
            >
              <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.arBtnGradient}>
                <Ionicons name="cube-outline" size={24} color="#4F46E5" />
                <Text style={styles.arBtnText}>Experience AR</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.chatBtn} onPress={startChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
              <Text style={styles.chatBtnText}>Chat with Innovator</Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL PROOF */}
          <View style={styles.socialProof}>
            <View style={styles.avatarGroup}>
              {[1,2,3,4].map(i => (
                <Image 
                  key={i} 
                  source={{ uri: `https://i.pravatar.cc/100?u=${i}${id}` }} 
                  style={[styles.miniAvatar, { marginLeft: i === 1 ? 0 : -12 }]} 
                />
              ))}
              <View style={[styles.miniAvatar, styles.moreAvatars]}>
                <Text style={styles.moreText}>+82</Text>
              </View>
            </View>
            <Text style={styles.socialText}>others have joined this innovation journey</Text>
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM BUTTON */}
      <BlurView intensity={80} tint="light" style={styles.bottomNav}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Pre-order Stake</Text>
          <Text style={styles.priceValue}>$1,000</Text>
        </View>
        <TouchableOpacity 
          style={styles.mainActionBtn}
          onPress={() => router.push({
            pathname: '/investor/invest-now',
            params: { pitchId: pitch?.id, pitchTitle: pitch?.title, entrepreneurId: pitch?.entrepreneurId }
          })}
        >
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.mainActionGradient}>
            <Text style={styles.mainActionText}>Support Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContainer: { paddingBottom: 150 },
  
  heroSection: { height: height * 0.5, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  heroContent: { position: 'absolute', bottom: 30, left: 24, right: 24 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  categoryText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#1E293B', textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 10 },

  contentSection: { paddingHorizontal: 24, marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },

  progressContainer: { marginTop: 30 },
  progressTrack: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  goalText: { textAlign: 'right', marginTop: 8, fontSize: 13, color: '#64748B', fontWeight: '700' },

  section: { marginTop: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  description: { fontSize: 16, color: '#475569', lineHeight: 26 },

  roadmapContainer: { paddingLeft: 10, marginTop: 10 },
  roadmapLine: { position: 'absolute', left: 4, top: 10, bottom: 10, width: 2, backgroundColor: '#E2E8F0' },
  roadmapItem: { flexDirection: 'row', marginBottom: 25, alignItems: 'flex-start' },
  roadmapDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0', marginTop: 6, zIndex: 2 },
  dotCompleted: { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 5, elevation: 5 },
  dotActive: { backgroundColor: '#4F46E5', width: 12, height: 12, borderRadius: 6, left: -1, shadowColor: '#4F46E5', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  roadmapContent: { marginLeft: 20 },
  roadmapTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  roadmapDate: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },

  commentCount: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
  commentCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 15 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentUser: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  commentTime: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  commentText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  addCommentBtn: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 15, alignItems: 'center' },
  addCommentText: { color: '#94A3B8', fontWeight: '700' },

  quickActions: { flexDirection: 'row', gap: 15, marginTop: 35 },
  arBtn: { flex: 1 },
  arBtnGradient: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  arBtnText: { color: '#1E293B', fontWeight: '800', fontSize: 15 },
  chatBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  chatBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  socialProof: { marginTop: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 15, borderRadius: 20 },
  avatarGroup: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, borderSize: 2, borderColor: '#FFF' },
  moreAvatars: { backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  moreText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  socialText: { flex: 1, marginLeft: 12, fontSize: 12, color: '#4F46E5', fontWeight: '600' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', justifyContent: 'space-between' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  priceValue: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  mainActionBtn: { flex: 1.5 },
  mainActionGradient: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mainActionText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
});
