import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
// 🤖 IMPORT THE AI SERVICE
import { generateAIPitch, analyzePitchContent, generatePitchSummary } from "../../services/aiService";

const { width } = Dimensions.get("window");

export default function CreatePitch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params?.category || "Education & Training";
  const insets = useSafeAreaInsets();

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
  const imageScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const categoryConfig = {
    "Education & Training": {
      image: require("../../assets/categories/education.png"),
      colors: ["#2E4DA7", "#0439c0"],
    },
    "Fashion & Apparel": {
      image: require("../../assets/categories/fashion.png"),
      colors: ["#8B5CF6", "#bc1e6d"],
    },
    "Food & Beverage": {
      image: require("../../assets/categories/food.png"),
      colors: ["#EF4444", "#F97316"],
    },
    "Technology & Software": {
      image: require("../../assets/categories/tech.png"),
      colors: ["#111827", "#06B6D4"],
    },
  };

  const config = categoryConfig[category] || {
    image: require("../../assets/categories/default.png"),
    colors: ["#4F46E5", "#06B6D4"],
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

      await addDoc(collection(db, "pitches"), {
        title,
        description,
        aiSummary, // 🤖 Save the TL;DR for investors!
        category,
        fundingGoal: Number(goal.replace(/,/g, "")),
        raisedAmount: 0,
        fileName: file?.name || null,
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
    <LinearGradient colors={config.colors} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 10 }}>
          <TouchableOpacity onPress={handleBack} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.categoryTitle}>{category}</Text>
        </View>

        {/* IMAGE AREA */}
        <Animated.View style={[styles.imageWrapper, { transform: [{ scale: imageScale }], opacity: fadeAnim }]}>
          <View style={styles.imageGlass}>
            <Image source={config.image} style={styles.image} resizeMode="contain" />
          </View>
        </Animated.View>

        <Text style={styles.mainTitle}>Submit Your Idea</Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          <BlurView intensity={60} tint="light" style={styles.card}>
            
            {/* 🤖 AI ASSISTANT SECTION */}
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={18} color="#4F46E5" />
                <Text style={styles.aiTitle}>AI Pitch Writer</Text>
              </View>
              <TextInput
                style={styles.aiInput}
                placeholder="Enter keywords (e.g. AI health, eco-fashion)..."
                value={aiKeywords}
                onChangeText={setAiKeywords}
              />
              <TouchableOpacity 
                style={styles.aiButton} 
                onPress={handleAiGenerate}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <ActivityIndicator color="#4F46E5" size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#4F46E5" />
                    <Text style={styles.aiButtonText}>Generate with Magic</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Project Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Smart Irrigation System"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Explain your business model or use AI above..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Funding Goal ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={goal}
              onChangeText={(text) => setGoal(formatCurrency(text))}
            />

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${fundingPercent}%` }]} />
            </View>
            <Text style={styles.previewText}>Goal Preview: ${goal || "0"}</Text>

            <Text style={styles.label}>Attach Pitch Deck</Text>
            <TouchableOpacity style={styles.attachBox} onPress={pickFile}>
              <Ionicons name="attach-outline" size={20} color="#4F46E5" />
              <Text style={{ marginLeft: 8, color: file ? "#10B981" : "#4B5563" }}>
                {file ? file.name : "Attach relevant documents..."}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.aiButton, { backgroundColor: 'rgba(79, 70, 229, 0.1)', borderColor: '#4F46E5', borderWidth: 1, marginBottom: 10 }]} 
              onPress={handleAiGrade}
              disabled={isAiLoading || loading}
            >
              {isAiLoading ? (
                <ActivityIndicator color="#4F46E5" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics" size={16} color="#4F46E5" />
                  <Text style={styles.aiButtonText}>Grade Pitch with AI</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} disabled={loading || isAiLoading}>
              <LinearGradient colors={config.colors} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Pitch</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255, 255, 255, 0.25)", justifyContent: "center", alignItems: "center" },
  categoryTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 6 },
  imageWrapper: { alignItems: "center", marginTop: 20 },
  imageGlass: { width: width * 0.9, height: 220, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  image: { width: "85%", height: "85%" },
  mainTitle: { textAlign: "center", fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginVertical: 12 },
  card: { marginHorizontal: 20, borderRadius: 30, padding: 20, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
  
  // 🤖 AI STYLES
  aiSection: { backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 20, padding: 15, marginTop: 10, borderWidth: 1, borderColor: "rgba(79, 70, 229, 0.2)" },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiTitle: { fontSize: 13, fontWeight: '800', color: '#4F46E5', marginLeft: 6, textTransform: 'uppercase' },
  aiInput: { backgroundColor: "#fff", borderRadius: 10, padding: 10, fontSize: 13 },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: '#fff', paddingVertical: 8, borderRadius: 10, borderWeight: 1, borderColor: '#4F46E5' },
  aiButtonText: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginLeft: 6 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 15 },

  label: { fontSize: 14, fontWeight: "600", marginTop: 10, color: "#1F2937" },
  input: { backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, marginTop: 8, color: "#000" },
  textArea: { height: 120, textAlignVertical: "top" },
  attachBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, marginTop: 8 },
  submitBtn: { marginTop: 25, paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  submitText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  progressBar: { height: 8, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 8, marginTop: 15 },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 8 },
  previewText: { fontSize: 12, marginTop: 4, color: "#F3F4F6" },
});