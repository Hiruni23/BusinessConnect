import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, View } from "react-native";

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: Platform.OS === 'ios' ? 25 : 15,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Marketplace",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? "storefront" : "storefront-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Market",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="offers"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      
      {/* HIDDEN UTILITY SCREENS */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="personal-info" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="service-details" options={{ href: null }} />
      <Tabs.Screen name="ar-view" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="innovation-details" options={{ href: null }} />
    </Tabs>
  );
}
