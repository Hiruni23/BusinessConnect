import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, Easing, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import SideMenu from '../components/SideMenu';

const { width, height } = Dimensions.get('window');

export default function ARView() {
  const router = useRouter();
  const { title } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  
  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: height * 0.4,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // After 3 seconds, "detect" the surface and show the AR object
    const timer = setTimeout(() => {
      setScanned(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -20,
              duration: 2000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ).start()
      ]).start();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData({ ...docSnap.data(), email: user.email });
    }, (error) => console.error("User profile listener failed:", error));

    return () => unsubUser();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView style={StyleSheet.absoluteFill} />
      
      {/* OVERLAY UI - Now positioned absolutely over the camera */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
              <Ionicons name="menu" size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { marginLeft: 10 }]}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <BlurView intensity={30} tint="dark" style={styles.titleContainer}>
            <Text style={styles.titleText}>{title || "Innovation"}</Text>
          </BlurView>
          <View style={{ width: 44 }} />
        </View>

        {!scanned && (
          <View style={styles.scanningOverlay}>
            <Animated.View 
              style={[
                styles.scanLine, 
                { transform: [{ translateY: scanLineAnim }] }
              ]} 
            >
              <LinearGradient 
                colors={['transparent', '#6366F1', 'transparent']} 
                style={{ flex: 1 }} 
                start={{x: 0.5, y: 0}} 
                end={{x: 0.5, y: 1}} 
              />
            </Animated.View>
            <Text style={styles.scanningText}>Scanning Surface...</Text>
          </View>
        )}

        {scanned && (
          <View style={styles.arObjectContainer}>
            <Animated.View 
              style={[
                styles.arObject,
                { 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: floatAnim }
                  ] 
                }
              ]}
            >
              <LinearGradient 
                colors={['#4F46E5', '#3730A3']} 
                style={styles.mock3DObject}
              >
                 <Ionicons name="cube" size={100} color="rgba(255,255,255,0.8)" />
                 <BlurView intensity={20} style={styles.reflection} />
              </LinearGradient>
              <View style={styles.shadow} />
            </Animated.View>
            
            <View style={styles.instructionContainer}>
              <BlurView intensity={40} tint="dark" style={styles.instructionBlur}>
                <Text style={styles.instructionText}>Tap to interact with the prototype</Text>
              </BlurView>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.captureBtn}>
             <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        userData={userData} 
        onLogout={handleLogout} 
        router={router} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#FFF',
    fontSize: 18,
    marginTop: height * 0.4
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  titleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  permissionBtn: {
    backgroundColor: '#6366F1',
    padding: 15,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 20,
  },
  permissionBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  scanningOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: height * 0.3,
    width: width * 0.8,
    height: 4,
    borderRadius: 2,
  },
  scanningText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 150,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  arObjectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arObject: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mock3DObject: {
    width: 200,
    height: 200,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  reflection: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    transform: [{ rotate: '45deg' }],
  },
  shadow: {
    width: 120,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 60,
    marginTop: 40,
    transform: [{ scaleX: 2 }],
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 50,
  },
  instructionBlur: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    overflow: 'hidden',
  },
  instructionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    padding: 4,
  },
  captureInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
  }
});
