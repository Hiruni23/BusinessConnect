import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { analyzeMilestoneRisk } from "../../services/aiService";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function StakeholderPitchDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();
  
  const [pitch, setPitch] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [aiAuditResults, setAiAuditResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});

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

      // Listen to milestones
      const q = query(collection(db, "milestones"), where("pitchId", "==", id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMilestones(list);
      }, (error) => {
        console.error('Milestones listener failed:', error);
      });

      return () => unsubscribe();
    }
  }, [id]);

  const handlePDFOpen = () => {
    if (pitch?.pitchDeckUrl) {
      Linking.openURL(pitch.pitchDeckUrl);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!user || !pitch) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "pitches", id), {
        status: newStatus,
        lastVettedBy: user.uid,
        lastVettedAt: serverTimestamp(),
      });

      setPitch((prev) => ({ ...prev, status: newStatus }));

      // Notify the entrepreneur
      await addDoc(collection(db, "notifications"), {
        userId: pitch.entrepreneurId,
        fromName: user.displayName || "Market Stakeholder",
        pitchTitle: pitch.title,
        type: "OVERSIGHT_UPDATE",
        message: `A stakeholder has updated your pitch status to ${newStatus?.toUpperCase()}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Status Updated", `The project is now marked as ${newStatus}.`);
    } catch (error) {
      console.error("Status Update Error:", error);
      Alert.alert("Error", "Failed to update project status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleMilestoneStatus = async (milestoneId, newStatus) => {
    setMilestoneLoading(true);
    try {
        await updateDoc(doc(db, "milestones", milestoneId), {
            status: newStatus,
            updatedAt: serverTimestamp(),
            // In a real app we'd add feedback here too
        });
        
        // Notify entrepreneur
        await addDoc(collection(db, "notifications"), {
            userId: pitch.entrepreneurId,
            title: `Milestone ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `A stakeholder has ${newStatus} a milestone for ${pitch.title}.`,
            isRead: false,
            createdAt: serverTimestamp()
        });

        Alert.alert("Success", `Milestone marked as ${newStatus}.`);
    } catch (e) {
        Alert.alert("Error", "Failed to update milestone.");
    } finally {
        setMilestoneLoading(false);
    }
  };

  const handleRunAudit = async (milestone) => {
    setAiLoading(prev => ({ ...prev, [milestone.id]: true }));
    try {
        const result = await analyzeMilestoneRisk(milestone.title, milestone.description, milestone.amount);
        setAiAuditResults(prev => ({ ...prev, [milestone.id]: result }));
    } catch (error) {
        Alert.alert("AI Error", error.message);
    } finally {
        setAiLoading(prev => ({ ...prev, [milestone.id]: false }));
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  const raisedAmount = Number(pitch?.raisedAmount || 0);
  const fundingGoal = Number(pitch?.fundingGoal || 0);
  const progressPercent = fundingGoal > 0 ? Math.min((raisedAmount / fundingGoal) * 100, 100) : 0;

  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Oversight Panel</Text>
          <TouchableOpacity style={s.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={T.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContainer}>
          
          {/* HEADER SECTION */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.mainCard}>
             <View style={s.badgeRow}>
                <View style={s.categoryBadge}>
                    <Text style={s.categoryText}>{pitch?.category || "Sector"}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: pitch?.status === 'active' ? (isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5') : (isDark ? 'rgba(245,158,11,0.1)' : '#FEF3C7') }]}>
                    <Text style={[s.statusText, { color: pitch?.status === 'active' ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#FBBF24' : '#D97706') }]}>
                        {pitch?.status?.toUpperCase()}
                    </Text>
                </View>
             </View>

             <Text style={s.pitchTitle}>{pitch?.title}</Text>
             
             <View style={s.metaRow}>
                <View style={s.metaItem}>
                    <Ionicons name="location-outline" size={14} color={T.subtext} />
                    <Text style={s.metaText}>Silicon Valley, CA</Text>
                </View>
                <View style={s.metaItem}>
                    <Ionicons name="time-outline" size={14} color={T.subtext} />
                    <Text style={s.metaText}>3d ago</Text>
                </View>
             </View>
          </Animated.View>

          {/* CAPITAL STATS */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.statsContainer}>
             <View style={s.statLine}>
                <Text style={s.statLabel}>Funding Progress</Text>
                <Text style={s.statValue}>${raisedAmount.toLocaleString()} / ${fundingGoal.toLocaleString()}</Text>
             </View>
             <View style={s.progressBarBg}>
                <LinearGradient 
                    colors={isDark ? ['#3B82F6', '#1E3A8A'] : ['#2563EB', '#1E40AF']} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 0}} 
                    style={[s.progressFill, { width: `${progressPercent}%` }]} 
                />
             </View>
          </Animated.View>

          {/* AI SUMMARY */}
          {pitch?.aiSummary && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={s.aiCard}>
               <View style={s.aiHeader}>
                  <View style={s.aiIconBg}>
                    <Ionicons name="sparkles" size={16} color={isDark ? '#60A5FA' : '#4F46E5'} />
                  </View>
                  <Text style={s.aiLabel}>AI OVERSIGHT SUMMARY</Text>
               </View>
               <Text style={s.aiText}>{pitch.aiSummary}</Text>
            </Animated.View>
          )}

          {/* DESCRIPTION */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={s.section}>
            <Text style={s.sectionLabel}>BUSINESS DESCRIPTION</Text>
            <Text style={s.descriptionText}>{pitch?.description}</Text>
          </Animated.View>

          {/* DOCUMENTS */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={s.section}>
             <Text style={s.sectionLabel}>VETTING DOCUMENTS</Text>
             <TouchableOpacity 
                style={[s.docCard, !pitch?.pitchDeckUrl && s.docDisabled]}
                onPress={handlePDFOpen}
                activeOpacity={0.7}
             >
                <View style={s.docIconBg}>
                    <Ionicons name="document-text" size={24} color={T.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.docTitle}>Pitch Deck / Business Plan</Text>
                    <Text style={s.docSub}>{pitch?.pitchDeckUrl ? 'PDF Document available for review' : 'No document uploaded'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T.subtext} />
             </TouchableOpacity>

             <TouchableOpacity style={[s.docCard, { marginTop: 12 }]} onPress={() => Alert.alert("Audit", "Financial reports loading...")}>
                <View style={[s.docIconBg, { backgroundColor: isDark ? 'rgba(52,211,153,0.1)' : '#F0FDF4' }]}>
                    <Ionicons name="stats-chart" size={24} color={isDark ? '#34D399' : '#10B981'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.docTitle}>Financial Reports</Text>
                    <Text style={s.docSub}>P&L Statements & Audit Trail</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T.subtext} />
             </TouchableOpacity>
          </Animated.View>

          {/* MILESTONE TRACKING (Section C & D) */}
          <Animated.View entering={FadeInDown.delay(600).springify()} style={s.section}>
             <Text style={s.sectionLabel}>MILESTONE GOVERNANCE</Text>
             
             {milestones.length === 0 ? (
                 <View style={s.emptyMilestone}>
                     <Text style={s.emptyMilestoneText}>No milestones defined for this pitch yet.</Text>
                 </View>
             ) : (
                 milestones.map((m) => (
                    <View key={m.id} style={s.milestoneCard}>
                        <View style={s.milestoneHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.milestoneTitle}>{m.title}</Text>
                                <Text style={s.milestoneAmount}>Impact Level: ${m.amount?.toLocaleString()}</Text>
                            </View>
                            <View style={[s.miniStatus, { backgroundColor: m.status === 'approved' ? (isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5') : (isDark ? 'rgba(148,163,184,0.1)' : '#F1F5F9') }]}>
                                <Text style={[s.miniStatusText, { color: m.status === 'approved' ? (isDark ? '#34D399' : '#10B981') : T.subtext }]}>{m.status?.toUpperCase()}</Text>
                            </View>
                        </View>
                        
                        <Text style={s.milestoneDesc}>{m.description}</Text>

                        {/* AI AUDIT RESULTS */}
                        {aiAuditResults[m.id] && (
                            <View style={s.aiRiskCard}>
                                <View style={s.aiRiskHeader}>
                                    <View style={[s.riskScoreCircle, { borderColor: aiAuditResults[m.id].riskScore > 7 ? (isDark ? '#F87171' : '#EF4444') : (isDark ? '#FBBF24' : '#F59E0B') }]}>
                                        <Text style={[s.riskScoreText, { color: aiAuditResults[m.id].riskScore > 7 ? (isDark ? '#F87171' : '#EF4444') : (isDark ? '#FBBF24' : '#F59E0B') }]}>
                                            {aiAuditResults[m.id].riskScore}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={s.aiRiskTitle}>Governance Analysis</Text>
                                        <Text style={s.aiRiskSub}>{aiAuditResults[m.id].analysis}</Text>
                                    </View>
                                </View>
                                
                                <View style={s.auditBlock}>
                                    <Text style={s.auditLabel}>RED FLAGS</Text>
                                    {aiAuditResults[m.id].redFlags.map((rf, i) => (
                                        <Text key={i} style={s.auditItem}>🚩 {rf}</Text>
                                    ))}
                                </View>

                                <View style={s.auditBlock}>
                                    <Text style={s.auditLabel}>RECOMMENDED QUESTIONS</Text>
                                    {aiAuditResults[m.id].auditQuestions.map((q, i) => (
                                        <Text key={i} style={s.auditItem}>❓ {q}</Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={s.milestoneActions}>
                            {m.status === 'completed' && (
                                <>
                                    <TouchableOpacity 
                                        style={[s.milestoneBtn, { backgroundColor: isDark ? '#34D399' : '#10B981' }]} 
                                        onPress={() => handleMilestoneStatus(m.id, 'approved')}
                                    >
                                        <Text style={s.milestoneBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[s.milestoneBtn, { backgroundColor: isDark ? '#F87171' : '#EF4444' }]}
                                        onPress={() => handleMilestoneStatus(m.id, 'rejected')}
                                    >
                                        <Text style={s.milestoneBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            <TouchableOpacity 
                                style={[s.milestoneBtn, { backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border }]} 
                                onPress={() => handleRunAudit(m)}
                                disabled={aiLoading[m.id]}
                            >
                                {aiLoading[m.id] ? (
                                    <ActivityIndicator size="small" color={T.accent} />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={14} color={T.accent} />
                                        <Text style={[s.milestoneBtnText, { color: T.accent, marginLeft: 4 }]}>AI Audit</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                 ))
             )}
          </Animated.View>

          {/* ADMINISTRATIVE ACTIONS */}
          <Animated.View entering={FadeInDown.delay(700).springify()} style={s.actionSection}>
             <Text style={s.sectionLabel}>ADMINISTRATIVE ACTIONS</Text>
             
             <View style={s.actionGrid}>
                {pitch?.status !== 'active' && (
                    <TouchableOpacity 
                        style={[s.actionBtn, { backgroundColor: isDark ? '#3B82F6' : '#4F46E5' }]}
                        onPress={() => handleUpdateStatus('active')}
                        disabled={updating}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={s.actionBtnText}>Approve & Activate</Text>
                    </TouchableOpacity>
                )}
                
                {pitch?.status !== 'rejected' && (
                    <TouchableOpacity 
                        style={[s.actionBtn, { backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border }]}
                        onPress={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={isDark ? '#F87171' : '#EF4444'} />
                        <Text style={[s.actionBtnText, { color: isDark ? '#F87171' : '#EF4444' }]}>Mark as High Risk</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[s.actionBtn, { backgroundColor: T.surface2, width: '100%', borderWidth: 1, borderColor: T.border }]}
                    onPress={() => handleUpdateStatus('on_hold')}
                    disabled={updating}
                >
                    <Ionicons name="pause-circle-outline" size={20} color={T.subtext} />
                    <Text style={[s.actionBtnText, { color: T.subtext }]}>Put On Hold for Review</Text>
                </TouchableOpacity>
             </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitle: { 
      fontSize: 18, 
      fontFamily: 'outfit-bold', 
      color: T.text,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    headerBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: T.glassBg, 
      justifyContent: 'center', 
      alignItems: 'center',
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    mainCard: { 
      backgroundColor: T.glassBg, 
      borderRadius: 32, 
      padding: 24, 
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 15,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    categoryBadge: { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    categoryText: { color: T.accent, fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '700' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontFamily: 'outfit-bold', fontWeight: '800' },
    pitchTitle: { fontSize: 26, fontFamily: 'outfit-bold', color: T.text, fontWeight: '900', marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: T.subtext, fontSize: 13, fontFamily: 'outfit-medium' },
    
    statsContainer: { marginTop: 25 },
    statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    statLabel: { color: T.subtext, fontSize: 13, fontFamily: 'outfit-medium', fontWeight: '600' },
    statValue: { color: T.text, fontSize: 14, fontFamily: 'outfit-bold', fontWeight: '800' },
    progressBarBg: { height: 8, backgroundColor: T.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    
    aiCard: { 
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : '#EEF2FF', 
      borderRadius: 24, 
      padding: 20, 
      marginTop: 25, 
      borderWidth: 1, 
      borderColor: T.glassBorder 
    },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    aiIconBg: { width: 28, height: 28, borderRadius: 10, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(79, 70, 229, 0.1)', justifyContent: 'center', alignItems: 'center' },
    aiLabel: { color: T.accent, fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800', letterSpacing: 0.5 },
    aiText: { color: T.text, fontSize: 15, fontFamily: 'outfit-medium', lineHeight: 22, fontStyle: 'italic' },
    
    section: { marginTop: 30 },
    sectionLabel: { color: T.subtext, fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800', letterSpacing: 1, marginBottom: 15 },
    descriptionText: { color: T.subtext, fontSize: 16, fontFamily: 'outfit-medium', lineHeight: 24 },
    
    docCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: T.glassBg, 
      padding: 16, 
      borderRadius: 20, 
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    docIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    docTitle: { color: T.text, fontSize: 15, fontFamily: 'outfit-bold', fontWeight: '800' },
    docSub: { color: T.subtext, fontSize: 13, fontFamily: 'outfit-medium', marginTop: 2 },
    docDisabled: { opacity: 0.6 },
    
    actionSection: { marginTop: 35 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 16, 
      borderRadius: 20, 
      gap: 8,
      flex: 1,
      minWidth: '45%'
    },
    actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'outfit-bold', fontWeight: '800' },
    emptyMilestone: { padding: 30, borderRadius: 24, backgroundColor: T.glassBg, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: T.glassBorder },
    emptyMilestoneText: { color: T.subtext, fontFamily: 'outfit-medium' },
    milestoneCard: { backgroundColor: T.glassBg, borderRadius: 24, padding: 20, marginBottom: 12, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: T.glassBorder },
    milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    milestoneTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800' },
    milestoneAmount: { fontSize: 12, color: isDark ? '#34D399' : '#10B981', fontFamily: 'outfit-bold', marginTop: 2 },
    milestoneDesc: { color: T.subtext, fontSize: 14, fontFamily: 'outfit-medium', marginVertical: 12 },
    miniStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    miniStatusText: { fontSize: 10, fontFamily: 'outfit-bold', fontWeight: '900' },
    milestoneActions: { flexDirection: 'row', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 15 },
    milestoneBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    milestoneBtnText: { color: '#fff', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
    aiRiskCard: {
      backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : '#F8FAFC',
      borderRadius: 20,
      padding: 16,
      marginTop: 10,
      borderLeftWidth: 4,
      borderLeftColor: T.accent,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    aiRiskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    riskScoreCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center'
    },
    riskScoreText: { fontSize: 16, fontFamily: 'outfit-bold', fontWeight: '900' },
    aiRiskTitle: { fontSize: 13, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800' },
    aiRiskSub: { fontSize: 12, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 2 },
    auditBlock: { marginTop: 12 },
    auditLabel: { fontSize: 10, fontFamily: 'outfit-bold', color: T.subtext, letterSpacing: 1, marginBottom: 5 },
    auditItem: { fontSize: 13, fontFamily: 'outfit-medium', color: T.subtext, marginBottom: 4, lineHeight: 18 }
  });
}
