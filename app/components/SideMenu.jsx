import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SideMenu = ({ visible, onClose, userData, onLogout, router }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  
  const getInitials = (name) => {
    if (!name) return "BC";
    const names = name.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          Animated.timing(translateX, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // --- ROLE-BASED NAVIGATION ITEMS ---
  const entrepreneurItems = [
    { label: "Dashboard", icon: "grid-outline", path: "/entrepreneur/dashboard" },  
    { label: "My Pitches", icon: "rocket-outline", path: "/entrepreneur/my-pitches" },
    { label: "Notifications", icon: "notifications-outline", path: "/entrepreneur/notifications" },
  ];

  const investorItems = [
    { label: "Investor Home", icon: "trending-up-outline", path: "/investor/dashboard" },
    { label: "Investor Profile", icon: "person-circle-outline", path: "/investor/profile" },
    { label: "My Portfolio", icon: "briefcase-outline", path: "/investor/portfolio" },
    { label: "Notifications", icon: "notifications-outline", path: "/investor/notifications" },
  ];

  // Select items based on Firestore role
  const menuItems = userData?.role === "Investor" ? investorItems : entrepreneurItems;
  const themeColor = userData?.role === "Investor" ? '#DCFCE7' : '#B4C6FF'; // Green tint for Investor

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <Animated.View 
            style={[styles.menuContainer, { transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
          >
            <SafeAreaView style={styles.safeArea}>
              
              {/* Profile Header with Dynamic Color */}
              <View style={[styles.profileHeader, { backgroundColor: themeColor }]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitials(userData?.fullName)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData?.fullName || 'Business Partner'}</Text>
                  <Text style={styles.userRole}>{userData?.role?.toUpperCase() || 'USER'}</Text>
                </View>
              </View>

              {/* Dynamic Menu List */}
              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <MenuItem 
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    onPress={() => {
                      onClose();
                      router?.push(item.path);
                    }}
                  />
                ))}
                
                {/* Generic Items */}
                <MenuItem 
                  icon="shield-checkmark-outline" 
                  label="Privacy Policy" 
                  onPress={() => { onClose(); router?.push("/profile/privacy-policy"); }}
                />
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                <Text style={styles.logoutLabel}>Logout</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={22} color="#3B82F6" />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuContainer: { width: '80%', height: '100%', backgroundColor: '#fff', borderTopRightRadius: 30, borderBottomRightRadius: 30 },
  safeArea: { flex: 1, padding: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 30, marginTop: 10, elevation: 3 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  userInfo: { marginLeft: 12, flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  userRole: { fontSize: 10, color: '#333', fontWeight: '800', marginTop: 2 },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  logoutLabel: { fontSize: 16, fontWeight: 'bold', color: '#EF4444', marginLeft: 10 }
});

export default SideMenu;