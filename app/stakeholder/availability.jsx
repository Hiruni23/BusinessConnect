// stakeholder/availability.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function Availability() {
  const [available, setAvailable] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 11:00 AM");
  const [consultationFee, setConsultationFee] = useState("2500");
  const [consultationDuration, setConsultationDuration] = useState("45");
  const [responseTimeHours, setResponseTimeHours] = useState("24");
  const [consultationMode, setConsultationMode] = useState("Video call");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = auth.currentUser;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "1:00 PM - 2:00 PM",
    "3:00 PM - 4:00 PM",
    "5:00 PM - 6:00 PM",
  ];

  const consultationModes = ["Video call", "Phone call", "In-person", "Chat"];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAvailability = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data()?.availability;

        if (data) {
          if (typeof data.active === "boolean") setAvailable(data.active);
          if (data.selectedDay) setSelectedDay(data.selectedDay);
          if (data.selectedSlot) setSelectedSlot(data.selectedSlot);
          if (data.fee !== undefined && data.fee !== null) setConsultationFee(String(data.fee));
          if (data.duration !== undefined && data.duration !== null) setConsultationDuration(String(data.duration));
          if (data.responseTimeHours !== undefined && data.responseTimeHours !== null) setResponseTimeHours(String(data.responseTimeHours));
          if (data.mode) setConsultationMode(data.mode);
        }
      } catch (error) {
        console.error("Failed to load availability:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in again to save your availability.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          availability: {
            active: available,
            selectedDay,
            selectedSlot,
            fee: Number(consultationFee || 0),
            duration: Number(consultationDuration || 0),
            responseTimeHours: Number(responseTimeHours || 0),
            mode: consultationMode,
            days,
            timeSlots,
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      Alert.alert("Saved", "Your consultation availability has been updated.");
    } catch (error) {
      console.error("Failed to save availability:", error);
      Alert.alert("Error", "Unable to save availability right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Availability</Text>
      <Text style={styles.subtitle}>
        Set your availability and consultation pricing details.
      </Text>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>Consultation Status</Text>
          <Text style={styles.statusText}>
            {available ? "Available for bookings" : "Not available"}
          </Text>
        </View>

        <Switch
          value={available}
          onValueChange={setAvailable}
          trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
          thumbColor={available ? "#2563EB" : "#9CA3AF"}
        />
      </View>

      <Text style={styles.sectionTitle}>Select Day</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.selectedDayButton,
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDay === day && styles.selectedDayText,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Select Time Slot</Text>

      {timeSlots.map((slot) => (
        <TouchableOpacity
          key={slot}
          style={[
            styles.slotCard,
            selectedSlot === slot && styles.selectedSlotCard,
          ]}
          onPress={() => setSelectedSlot(slot)}
        >
          <View style={styles.slotLeft}>
            <Ionicons
              name="time-outline"
              size={22}
              color={selectedSlot === slot ? "#2563EB" : "#6B7280"}
            />
            <Text
              style={[
                styles.slotText,
                selectedSlot === slot && styles.selectedSlotText,
              ]}
            >
              {slot}
            </Text>
          </View>

          {selectedSlot === slot && (
            <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Consultation Details</Text>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Consultation Fee ($)</Text>
        <TextInput
          value={consultationFee}
          onChangeText={setConsultationFee}
          keyboardType="numeric"
          placeholder="2500"
          style={styles.textInput}
        />
      </View>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Session Duration (minutes)</Text>
        <TextInput
          value={consultationDuration}
          onChangeText={setConsultationDuration}
          keyboardType="numeric"
          placeholder="45"
          style={styles.textInput}
        />
      </View>

      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>Response Time (hours)</Text>
        <TextInput
          value={responseTimeHours}
          onChangeText={setResponseTimeHours}
          keyboardType="numeric"
          placeholder="24"
          style={styles.textInput}
        />
      </View>

      <Text style={styles.sectionTitle}>Consultation Mode</Text>

      <View style={styles.modeWrap}>
        {consultationModes.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeChip, consultationMode === mode && styles.modeChipActive]}
            onPress={() => setConsultationMode(mode)}
          >
            <Text style={[styles.modeText, consultationMode === mode && styles.modeTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Availability"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    padding: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8FF",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 20,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  statusText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginTop: 28,
    marginBottom: 14,
  },

  dayButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  selectedDayButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },

  selectedDayText: {
    color: "#FFFFFF",
  },

  slotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedSlotCard: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  slotText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "600",
  },

  fieldCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  modeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },

  modeChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modeChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },

  modeText: {
    color: "#374151",
    fontWeight: "700",
  },

  modeTextActive: {
    color: "#2563EB",
  },

  selectedSlotText: {
    color: "#2563EB",
  },

  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 22,
    marginBottom: 40,
    alignItems: "center",
  },

  saveButtonDisabled: {
    opacity: 0.75,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});