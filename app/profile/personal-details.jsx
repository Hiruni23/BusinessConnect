import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Animated,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { db, storage } from "../../firebaseConfig";

export default function PersonalDetails() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fullName, setFullName] = useState("");
  const [email] = useState(user?.email || "");
  const [dob, setDob] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [nicImage, setNicImage] = useState("");

  useEffect(() => {
    fetchDetails();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchDetails = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setFullName(data.fullName || "");
      setGender(data.gender || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setNic(data.nic || "");
      setNicImage(data.nicImage || "");
      if (data.dob) setDob(new Date(data.dob));
    }
  };

  // PROFILE COMPLETION
  const fields = [fullName, gender, address, phone, nic];
  const completed = fields.filter(Boolean).length;
  const percent = Math.round((completed / fields.length) * 100);

  // Dynamic Gradient
  const getGradient = () => {
    if (percent <= 30) return ["#ff9a9e", "#fad0c4"];
    if (percent <= 70) return ["#fbc2eb", "#a6c1ee"];
    if (percent < 100) return ["#a1c4fd", "#c2e9fb"];
    return ["#84fab0", "#8fd3f4"];
  };

  const uploadNIC = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `nic/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.uid), {
        nicImage: downloadURL,
      });

      setNicImage(downloadURL);
    }
  };

  const handleDone = () => {
    router.replace("/entrepreneur/dashboard");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={getGradient()} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />

        {/* Floating Particles */}
        <View style={styles.particle} />
        <View style={[styles.particle, { left: 80 }]} />
        <View style={[styles.particle, { left: 200 }]} />

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color="#000" />
            </TouchableOpacity>

            <Text style={styles.title}>Personal Details</Text>

            <TouchableOpacity onPress={handleDone}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* COMPLETION CIRCLE */}
          <View style={styles.circleWrapper}>
            <Svg width={120} height={120}>
              <Circle
                stroke="rgba(0,0,0,0.1)"
                fill="none"
                cx="60"
                cy="60"
                r="45"
                strokeWidth="10"
              />
              <Circle
                stroke="#000"
                fill="none"
                cx="60"
                cy="60"
                r="45"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={
                  2 * Math.PI * 45 - (percent / 100) * 2 * Math.PI * 45
                }
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>

          {percent === 100 && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}

          {/* PROFILE ANALYTICS */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Profile Analytics</Text>
            <Text>Completion: {percent}%</Text>
            <Text>Documents: {nicImage ? "1 Uploaded" : "0 Uploaded"}</Text>
          </View>

          {/* GLASS CARD */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <BlurView intensity={50} tint="light" style={styles.card}>
              <TextInput
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />

              <TextInput
                value={email}
                editable={false}
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDate(true)}
              >
                <Text>{dob.toDateString()}</Text>
              </TouchableOpacity>

              {showDate && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  onChange={(e, d) => {
                    setShowDate(false);
                    if (d) setDob(d);
                  }}
                />
              )}

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={gender}
                  onValueChange={(v) => setGender(v)}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                </Picker>
              </View>

              <TextInput
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />

              <TextInput
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
              />

              <TextInput
                placeholder="NIC"
                value={nic}
                onChangeText={setNic}
                style={styles.input}
              />

              <TouchableOpacity style={styles.nicUpload} onPress={uploadNIC}>
                <Text style={{ color: "#000" }}>Upload NIC Image</Text>
              </TouchableOpacity>

              {nicImage && (
                <Image source={{ uri: nicImage }} style={styles.nicImage} />
              )}
            </BlurView>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
  },

  doneText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },

  circleWrapper: {
    alignItems: "center",
    marginVertical: 30,
  },

  percentText: {
    position: "absolute",
    top: 50,
    fontWeight: "bold",
    color: "#000",
  },

  badge: {
    alignSelf: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    marginLeft: 5,
  },

  analyticsCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },

  analyticsTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  card: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  pickerWrapper: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    marginBottom: 12,
  },

  nicUpload: {
    alignItems: "center",
    marginVertical: 10,
  },

  nicImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },

  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    bottom: 0,
    left: 20,
  },
});