import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Alert,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";

export default function EditProfile() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [fullName, setFullName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFullName(data.fullName);
      setPhotoURL(data.photoURL);
    }
  };

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profiles/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.uid), {
        photoURL: downloadURL,
      });

      setPhotoURL(downloadURL);
    }
  };

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), {
      fullName,
    });
    Alert.alert("Updated Successfully");
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{
            uri:
              photoURL ||
              "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder="Full Name"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={{ color: "#fff" }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
        : 0,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: { fontSize: 18, fontWeight: "700" },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },

  saveBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
  },
});