import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
    { label: "My Pitches", icon: "rocket-outline", path: "/entrepreneur/my-pitches" },
    { label: "Manage Products", icon: "cube-outline", path: "/entrepreneur/manage-products" },
    { label: "Meeting Sessions", icon: "calendar-outline", path: "/entrepreneur/meetings" },
    { label: "Book Consultation", icon: "chatbubbles-outline", path: "/entrepreneur/book-consultation" },
    { label: "Consultation Requests", icon: "chatbubble-ellipses-outline", path: "/entrepreneur/consultation-requests" },
    { label: "Notifications", icon: "notifications-outline", path: "/entrepreneur/notifications" },
  ];

  const investorItems = [
    { label: "Investor Home", icon: "trending-up-outline", path: "/investor/dashboard" },
    { label: "Investor Profile", icon: "person-circle-outline", path: "/investor/profile" },
    { label: "My Portfolio", icon: "briefcase-outline", path: "/investor/portfolio" },
    { label: "Notifications", icon: "notifications-outline", path: "/investor/notifications" },
  ];

  const stakeholderItems = [
    { label: "Executive Admin", icon: "shield-half-outline", path: "/stakeholder/dashboard" },
    { label: "Vetting Queue", icon: "checkmark-circle-outline", path: "/stakeholder/milestones" },
    { label: "Meeting Sessions", icon: "calendar-outline", path: "/stakeholder/meetings" },
    { label: "Audit Roadmap", icon: "git-branch-outline", path: "/stakeholder/calendar" },
    { label: "Market Intel", icon: "analytics-outline", path: "/stakeholder/analytics" },
    { label: "Consultation Requests", icon: "chatbubble-ellipses-outline", path: "/stakeholder/consultation-requests" },
    { label: "Messages", icon: "mail-outline", path: "/stakeholder/messages" },
    { label: "Availability", icon: "time-outline", path: "/stakeholder/availability" },
    { label: "Earnings", icon: "wallet-outline", path: "/stakeholder/earnings" },
    { label: "Consultant Profile", icon: "person-circle-outline", path: "/stakeholder/consultant-profile" },
  ];

  const customerItems = [
    { label: "Marketplace", icon: "storefront-outline", path: "/customer/dashboard" },
    { label: "Explore", icon: "search-outline", path: "/customer/explore" },
    { label: "AR Prototype", icon: "cube-outline", path: "/customer/ar-view" },
    { label: "Offers & Deals", icon: "pricetag-outline", path: "/customer/offers" },
    { label: "Cart", icon: "cart-outline", path: "/customer/cart" },
    { label: "Orders", icon: "receipt-outline", path: "/customer/orders" },
    { label: "Notifications", icon: "notifications-outline", path: "/customer/notifications" },
  ];

  // Select items based on Firestore role
  const getMenuItems = () => {
    const role = userData?.role?.toLowerCase();
    if (role === 'investor') return investorItems;
    if (role === 'stakeholder') return stakeholderItems;
    if (role === 'customer') return customerItems;
    return entrepreneurItems;
  };

  const menuItems = getMenuItems();
  
  const getThemeColor = () => {
    const role = userData?.role?.toLowerCase();
    if (role === 'investor') return '#F0FDF4'; // Green tint
    if (role === 'stakeholder') return '#F5F7FF'; // Indigo tint
    if (role === 'customer') return '#FFF7ED'; // Orange tint
    return '#EFF6FF'; // Blue tint
  };

  const getAccentColor = () => {
    const role = userData?.role?.toLowerCase();
    if (role === 'investor') return '#22C55E';
    if (role === 'stakeholder') return '#4F46E5';
    if (role === 'customer') return '#F97316';
    return '#3B82F6';
  };

  const getAccountLinks = () => {
    const role = userData?.role?.toLowerCase();
    if (role === 'customer') {
      return {
        profile: '/customer/profile',
        privacy: '/customer/privacy',
      };
    }

    return {
      profile: '/profile',
      privacy: '/profile/privacy-policy',
    };
  };

  const accountLinks = getAccountLinks();

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
              <View style={[styles.profileHeader, { backgroundColor: getThemeColor() }]}>
                <View style={[styles.avatarCircle, { borderColor: getAccentColor() + '40', borderWidth: 2 }]}>
                  <Text style={[styles.avatarText, { color: getAccentColor() }]}>{getInitials(userData?.fullName)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData?.fullName || 'Business Partner'}</Text>
                  <Text style={[styles.userRole, { color: getAccentColor() }]}>{userData?.role?.toUpperCase() || 'USER'}</Text>
                </View>
              </View>

              {/* Dynamic Menu List */}
              <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>MAIN NAVIGATION</Text>
                </View>
                {menuItems.map((item, index) => (
                  <MenuItem 
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    accentColor={getAccentColor()}
                    onPress={() => {
                      onClose();
                      router?.push(item.path);
                    }}
                  />
                ))}
                
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <Text style={styles.sectionLabel}>ACCOUNT SERVICES</Text>
                </View>
                <MenuItem 
                  icon="person-outline" 
                  label="Profile Settings" 
                  accentColor={getAccentColor()}
                  onPress={() => { onClose(); router?.push(accountLinks.profile); }}
                />
                <MenuItem 
                  icon="shield-checkmark-outline" 
                  label="Privacy Policy" 
                  accentColor={getAccentColor()}
                  onPress={() => { onClose(); router?.push(accountLinks.privacy); }}
                />
              </ScrollView>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutLabel}>LOG OUT</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const MenuItem = ({ icon, label, onPress, accentColor }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: accentColor + '10' }]}>
      <Ionicons name={icon} size={20} color={accentColor} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  menuContainer: { width: '82%', height: '100%', backgroundColor: '#fff' },
  safeArea: { flex: 1, paddingHorizontal: 25, paddingVertical: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 30, marginTop: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900' },
  userInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  userRole: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  menuList: { flex: 1 },
  sectionHeader: { marginBottom: 15, paddingLeft: 5 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, borderRadius: 15, padding: 5 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  logoutLabel: { fontSize: 12, fontWeight: '900', color: '#EF4444', marginLeft: 12, letterSpacing: 1 }
});

export default SideMenu;