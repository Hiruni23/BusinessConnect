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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { analyzeMilestoneRisk } from "../../services/aiService";

const { width } = Dimensions.get("window");

export default function StakeholderPitchDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const raisedAmount = Number(pitch?.raisedAmount || 0);
  const fundingGoal = Number(pitch?.fundingGoal || 0);
  const progressPercent = fundingGoal > 0 ? Math.min((raisedAmount / fundingGoal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oversight Panel</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          
          {/* HEADER SECTION */}
          <View style={styles.mainCard}>
             <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{pitch?.category || "Sector"}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: pitch?.status === 'active' ? '#ECFDF5' : '#FEF3C7' }]}>
                    <Text style={[styles.statusText, { color: pitch?.status === 'active' ? '#10B981' : '#D97706' }]}>
                        {pitch?.status?.toUpperCase()}
                    </Text>
                </View>
             </View>

             <Text style={styles.pitchTitle}>{pitch?.title}</Text>
             
             <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>Silicon Valley, CA</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>3d ago</Text>
                </View>
             </View>
          </View>

          {/* CAPITAL STATS */}
          <View style={styles.statsContainer}>
             <View style={styles.statLine}>
                <Text style={styles.statLabel}>Funding Progress</Text>
                <Text style={styles.statValue}>${raisedAmount.toLocaleString()} / ${fundingGoal.toLocaleString()}</Text>
             </View>
             <View style={styles.progressBarBg}>
                <LinearGradient 
                    colors={['#4F46E5', '#6366F1']} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 0}} 
                    style={[styles.progressFill, { width: `${progressPercent}%` }]} 
                />
             </View>
          </View>

          {/* AI SUMMARY */}
          {pitch?.aiSummary && (
            <View style={styles.aiCard}>
               <View style={styles.aiHeader}>
                  <View style={styles.aiIconBg}>
                    <Ionicons name="sparkles" size={16} color="#4F46E5" />
                  </View>
                  <Text style={styles.aiLabel}>AI OVERSIGHT SUMMARY</Text>
               </View>
               <Text style={styles.aiText}>{pitch.aiSummary}</Text>
            </View>
          )}

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BUSINESS DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{pitch?.description}</Text>
          </View>

          {/* DOCUMENTS */}
          <View style={styles.section}>
             <Text style={styles.sectionLabel}>VETTING DOCUMENTS</Text>
             <TouchableOpacity 
                style={[styles.docCard, !pitch?.pitchDeckUrl && styles.docDisabled]}
                onPress={handlePDFOpen}
                activeOpacity={0.7}
             >
                <View style={styles.docIconBg}>
                    <Ionicons name="document-text" size={24} color="#4F46E5" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.docTitle}>Pitch Deck / Business Plan</Text>
                    <Text style={styles.docSub}>{pitch?.pitchDeckUrl ? 'PDF Document available for review' : 'No document uploaded'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
             </TouchableOpacity>

             <TouchableOpacity style={[styles.docCard, { marginTop: 12 }]} onPress={() => Alert.alert("Audit", "Financial reports loading...")}>
                <View style={[styles.docIconBg, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="stats-chart" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.docTitle}>Financial Reports</Text>
                    <Text style={styles.docSub}>P&L Statements & Audit Trail</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
             </TouchableOpacity>
          </View>

          {/* MILESTONE TRACKING (Section C & D) */}
          <View style={styles.section}>
             <Text style={styles.sectionLabel}>MILESTONE GOVERNANCE</Text>
             
             {milestones.length === 0 ? (
                 <View style={styles.emptyMilestone}>
                     <Text style={styles.emptyMilestoneText}>No milestones defined for this pitch yet.</Text>
                 </View>
             ) : (
                 milestones.map((m) => (
                    <View key={m.id} style={styles.milestoneCard}>
                        <View style={styles.milestoneHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.milestoneTitle}>{m.title}</Text>
                                <Text style={styles.milestoneAmount}>Impact Level: ${m.amount?.toLocaleString()}</Text>
                            </View>
                            <View style={[styles.miniStatus, { backgroundColor: m.status === 'approved' ? '#ECFDF5' : '#F1F5F9' }]}>
                                <Text style={[styles.miniStatusText, { color: m.status === 'approved' ? '#10B981' : '#64748B' }]}>{m.status?.toUpperCase()}</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.milestoneDesc}>{m.description}</Text>

                        {/* AI AUDIT RESULTS */}
                        {aiAuditResults[m.id] && (
                            <View style={styles.aiRiskCard}>
                                <View style={styles.aiRiskHeader}>
                                    <View style={[styles.riskScoreCircle, { borderColor: aiAuditResults[m.id].riskScore > 7 ? '#EF4444' : '#F59E0B' }]}>
                                        <Text style={[styles.riskScoreText, { color: aiAuditResults[m.id].riskScore > 7 ? '#EF4444' : '#F59E0B' }]}>
                                            {aiAuditResults[m.id].riskScore}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.aiRiskTitle}>Governance Analysis</Text>
                                        <Text style={styles.aiRiskSub}>{aiAuditResults[m.id].analysis}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.auditBlock}>
                                    <Text style={styles.auditLabel}>RED FLAGS</Text>
                                    {aiAuditResults[m.id].redFlags.map((rf, i) => (
                                        <Text key={i} style={styles.auditItem}>🚩 {rf}</Text>
                                    ))}
                                </View>

                                <View style={styles.auditBlock}>
                                    <Text style={styles.auditLabel}>RECOMMENDED QUESTIONS</Text>
                                    {aiAuditResults[m.id].auditQuestions.map((q, i) => (
                                        <Text key={i} style={styles.auditItem}>❓ {q}</Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.milestoneActions}>
                            {m.status === 'completed' && (
                                <>
                                    <TouchableOpacity 
                                        style={[styles.milestoneBtn, { backgroundColor: '#10B981' }]} 
                                        onPress={() => handleMilestoneStatus(m.id, 'approved')}
                                    >
                                        <Text style={styles.milestoneBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.milestoneBtn, { backgroundColor: '#EF4444' }]}
                                        onPress={() => handleMilestoneStatus(m.id, 'rejected')}
                                    >
                                        <Text style={styles.milestoneBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            <TouchableOpacity 
                                style={[styles.milestoneBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]} 
                                onPress={() => handleRunAudit(m)}
                                disabled={aiLoading[m.id]}
                            >
                                {aiLoading[m.id] ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={14} color="#4F46E5" />
                                        <Text style={[styles.milestoneBtnText, { color: '#4F46E5', marginLeft: 4 }]}>AI Audit</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                 ))
             )}
          </View>

          {/* ADMINISTRATIVE ACTIONS */}
          <View style={styles.actionSection}>
             <Text style={styles.sectionLabel}>ADMINISTRATIVE ACTIONS</Text>
             
             <View style={styles.actionGrid}>
                {pitch?.status !== 'active' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]}
                        onPress={() => handleUpdateStatus('active')}
                        disabled={updating}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Approve & Activate</Text>
                    </TouchableOpacity>
                )}
                
                {pitch?.status !== 'rejected' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
                        onPress={() => handleUpdateStatus('rejected')}
                        disabled={updating}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Mark as High Risk</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#F1F5F9', width: '100%' }]}
                    onPress={() => handleUpdateStatus('on_hold')}
                    disabled={updating}
                >
                    <Ionicons name="pause-circle-outline" size={20} color="#64748B" />
                    <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Put On Hold for Review</Text>
                </TouchableOpacity>
             </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
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
    color: '#1E293B',
    fontWeight: '800'
  },
  headerBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  mainCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 32, 
    padding: 24, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryText: { color: '#4F46E5', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: 'outfit-bold', fontWeight: '800' },
  pitchTitle: { fontSize: 26, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '900', marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#64748B', fontSize: 13, fontFamily: 'outfit-medium' },
  
  statsContainer: { marginTop: 25 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { color: '#64748B', fontSize: 13, fontFamily: 'outfit-medium', fontWeight: '600' },
  statValue: { color: '#1E293B', fontSize: 14, fontFamily: 'outfit-bold', fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  
  aiCard: { 
    backgroundColor: '#EEF2FF', 
    borderRadius: 24, 
    padding: 20, 
    marginTop: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(79, 70, 229, 0.1)' 
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  aiIconBg: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(79, 70, 229, 0.1)', justifyContent: 'center', alignItems: 'center' },
  aiLabel: { color: '#4F46E5', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800', letterSpacing: 0.5 },
  aiText: { color: '#1E293B', fontSize: 15, fontFamily: 'outfit-medium', lineHeight: 22, fontStyle: 'italic' },
  
  section: { marginTop: 30 },
  sectionLabel: { color: '#94A3B8', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800', letterSpacing: 1, marginBottom: 15 },
  descriptionText: { color: '#475569', fontSize: 16, fontFamily: 'outfit-medium', lineHeight: 24 },
  
  docCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 20, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10
  },
  docIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  docTitle: { color: '#1E293B', fontSize: 15, fontFamily: 'outfit-bold', fontWeight: '800' },
  docSub: { color: '#94A3B8', fontSize: 13, fontFamily: 'outfit-medium', marginTop: 2 },
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
  emptyMilestone: { padding: 30, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyMilestoneText: { color: '#94A3B8', fontFamily: 'outfit-medium' },
  milestoneCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  milestoneTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  milestoneAmount: { fontSize: 12, color: '#10B981', fontFamily: 'outfit-bold', marginTop: 2 },
  milestoneDesc: { color: '#64748B', fontSize: 14, fontFamily: 'outfit-medium', marginVertical: 12 },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniStatusText: { fontSize: 10, fontFamily: 'outfit-bold', fontWeight: '900' },
  milestoneActions: { flexDirection: 'row', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  milestoneBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  milestoneBtnText: { color: '#fff', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
  aiRiskCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#E2E8F0'
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
  aiRiskTitle: { fontSize: 13, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  aiRiskSub: { fontSize: 12, fontFamily: 'outfit-medium', color: '#64748B', marginTop: 2 },
  auditBlock: { marginTop: 12 },
  auditLabel: { fontSize: 10, fontFamily: 'outfit-bold', color: '#94A3B8', letterSpacing: 1, marginBottom: 5 },
  auditItem: { fontSize: 13, fontFamily: 'outfit-medium', color: '#475569', marginBottom: 4, lineHeight: 18 }
});
