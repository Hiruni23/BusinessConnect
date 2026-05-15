import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, storage } from "../../firebaseConfig";
// 🤖 IMPORT THE AI SERVICE
import { generateAIPitch, analyzePitchContent, generatePitchSummary } from "../../services/aiService";

const { width } = Dimensions.get("window");

export default function CreatePitch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params?.category || "Education & Training";

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🤖 AI State
  const [aiKeywords, setAiKeywords] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const categoryConfig = {
    "Education & Training": {
      icon: "school-outline",
      colors: ["#4F46E5", "#3730A3"],
    },
    "Fashion & Apparel": {
      icon: "shirt-outline",
      colors: ["#4F46E5", "#3730A3"],
    },
    "Food & Beverage": {
      icon: "restaurant-outline",
      colors: ["#4F46E5", "#3730A3"],
    },
    "Technology & Software": {
      icon: "hardware-chip-outline",
      colors: ["#4F46E5", "#3730A3"],
    },
    "Travel & Tourism": {
      icon: "airplane-outline",
      colors: ["#4F46E5", "#3730A3"],
    }
  };

  const config = categoryConfig[category] || {
    icon: "briefcase-outline",
    colors: ["#4F46E5", "#3730A3"],
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/entrepreneur/dashboard");
  };

  /* ================= AI LOGIC ================= */
  const handleAiGenerate = async () => {
    if (!aiKeywords.trim()) {
      Alert.alert("AI Assistant", "Please enter a few keywords (e.g. solar power, delivery app) so I can write your pitch!");
      return;
    }

    setIsAiLoading(true);
    try {
      const generatedPitch = await generateAIPitch(aiKeywords);
      setDescription(generatedPitch);
      Alert.alert("Success ✨", "AI has generated your pitch description!");
    } catch (error) {
      Alert.alert("AI Error", "Could not connect to Gemini. Please check your API key.");
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiGrade = async () => {
    if (!description || description.length < 50) {
      Alert.alert("AI Reviewer", "Please write a bit more in the description so the AI can give you a proper grade!");
      return;
    }

    setIsAiLoading(true);
    try {
      const analysis = await analyzePitchContent(title, description, goal, category);
      
      const feedbackStr = analysis.feedback.map(item => `• ${item}`).join("\n");
      
      Alert.alert(
        "AI Pitch Score: " + analysis.score + "/100 ✨",
        `${analysis.verdict}\n\nSuggestions for Improvement:\n${feedbackStr}`,
        [{ text: "Got it, thanks!" }]
      );
    } catch (error) {
      Alert.alert("AI Error", "Could not analyze the pitch. Is the content too short?");
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const pickFile = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPicking(false);
    }
  };

  const formatCurrency = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fundingPercent = Math.min(
    (Number(goal.replace(/,/g, "")) / 50000) * 100 || 0,
    100
  );

  const handleSubmit = async () => {
    if (!title || !description || !goal) {
      Alert.alert("Missing Fields", "Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const user = auth?.currentUser;
      if (!user) {
        Alert.alert("Auth Error", "Session expired. Please log in again.");
        router.replace("/auth/login");
        return;
      }

      let aiSummary = "No AI summary generated.";
      try {
        aiSummary = await generatePitchSummary(description);
      } catch (e) { console.error("Summary generation failed", e); }

      let pitchDeckUrl = null;
      if (file && file.uri) {
        try {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const fileRef = ref(storage, `pitches/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, blob);
          pitchDeckUrl = await getDownloadURL(fileRef);
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          Alert.alert("Upload Warning", "Could not upload the pitch deck to cloud storage. Saving without the file.");
        }
      }

      await addDoc(collection(db, "pitches"), {
        title,
        description,
        aiSummary,
        category,
        fundingGoal: Number(goal.replace(/,/g, "")),
        raisedAmount: 0,
        fileName: file?.name || null,
        pitchDeckUrl: pitchDeckUrl,
        userId: user.uid,
        entrepreneurId: user.uid,
        createdAt: serverTimestamp(),
        status: "Open",
        views: 0,
        interested: 0,
      });

      Alert.alert("Success 🚀", "Your pitch has been published!", [
        { text: "Go to Dashboard", onPress: () => router.replace("/entrepreneur/dashboard") },
      ]);
    } catch (error) {
      Alert.alert("Error", "We couldn't save your pitch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Pitch</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* CATEGORY BANNER */}
          <LinearGradient colors={config.colors} style={styles.categoryBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={config.icon} size={32} color="#FFFFFF" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.bannerSubtitle}>SELECTED CATEGORY</Text>
              <Text style={styles.bannerTitle} numberOfLines={1}>{category}</Text>
            </View>
            <TouchableOpacity onPress={handleBack} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* MAIN FORM CARD */}
          <View style={styles.formCard}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Next-Gen Smart App"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* 🤖 AI ASSISTANT SECTION */}
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <View style={styles.aiBadgeIcon}>
                  <Ionicons name="sparkles" size={16} color="#4F46E5" />
                </View>
                <Text style={styles.aiTitle}>AI Pitch Writer</Text>
              </View>
              <Text style={styles.aiHint}>Stuck? Enter keywords and let AI write the pitch for you.</Text>
              <TextInput
                style={styles.aiInput}
                placeholder="e.g. AI health, eco-fashion..."
                placeholderTextColor="#94A3B8"
                value={aiKeywords}
                onChangeText={setAiKeywords}
              />
              <TouchableOpacity 
                style={styles.aiButton} 
                onPress={handleAiGenerate}
                disabled={isAiLoading}
              >
                <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.aiButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {isAiLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color="#FFFFFF" />
                      <Text style={styles.aiButtonText}>Generate Pitch</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your business model, target market, and value proposition..."
                placeholderTextColor="#94A3B8"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Funding Goal ($)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 50,000"
                placeholderTextColor="#94A3B8"
                value={goal}
                onChangeText={(text) => setGoal(formatCurrency(text))}
              />
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressFill, { width: `${fundingPercent}%` }]} />
                </View>
                <Text style={styles.previewText}>${goal || "0"}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Attach Pitch Deck (PDF/PPT)</Text>
              <TouchableOpacity style={styles.attachBox} onPress={pickFile}>
                <Ionicons name="document-attach" size={24} color={file ? "#10B981" : "#4F46E5"} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.attachText, file && { color: "#10B981", fontWeight: '700' }]}>
                    {file ? file.name : "Tap to browse files"}
                  </Text>
                  {!file && <Text style={styles.attachSubtext}>Max size: 10MB</Text>}
                </View>
                {file && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.gradeButton} 
              onPress={handleAiGrade}
              disabled={isAiLoading || loading}
            >
              <Ionicons name="analytics" size={18} color="#4F46E5" />
              <Text style={styles.gradeButtonText}>Grade Pitch with AI</Text>
            </TouchableOpacity>

          </View>
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* BOTTOM SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSubmit} disabled={loading || isAiLoading}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>Submit Pitch Proposal</Text>
                <Ionicons name="rocket" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  
  categoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    elevation: 6,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bannerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  bannerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  editBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    elevation: 4,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textArea: { height: 140, textAlignVertical: "top", paddingTop: 16 },

  aiSection: {
    backgroundColor: "#F5F8FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
  },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  aiBadgeIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginRight: 8 },
  aiTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  aiHint: { fontSize: 12, color: "#64748B", marginBottom: 12 },
  aiInput: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, fontSize: 14, color: "#0F172A", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12 },
  aiButton: { borderRadius: 12, overflow: "hidden" },
  aiButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 8 },
  aiButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  progressContainer: { marginTop: 12 },
  progressBarBg: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 4 },
  previewText: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 8, alignSelf: "flex-end" },

  attachBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  attachText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  attachSubtext: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  gradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  gradeButtonText: { color: "#4F46E5", fontSize: 14, fontWeight: "700" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});