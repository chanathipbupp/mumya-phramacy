import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { loginWithEmail, loginWithGoogle } from "../composables/fetchAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export const screenOptions = {
  headerShown: false,
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Phone modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleName, setGoogleName] = useState(""); // <-- Add this state

  // 👇 Google OAuth Config
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    // androidClientId: "1084156198587-oni77l00r1ec2totlvid7ah34fneghad.apps.googleusercontent.com", // Add your Android Client ID here
    webClientId:
      "1084156198587-195hlgjemnh15ucqn7bi9mbqh697cu2s.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"],
    redirectUri: makeRedirectUri({
      useProxy: false, // ✅ ใช้ true ถ้า run ใน Expo Go
    }),
  });

  // =========================
  // Email/Phone Login
  // =========================
  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email) {
        Toast.show({
          type: "error",
          text1: "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์",
        });
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\d{8,15}$/;
      let loginData: { email?: string; phone?: string; password: string } = {
        password,
      };

      if (emailRegex.test(email)) {
        loginData.email = email;
      } else if (phoneRegex.test(email)) {
        loginData.phone = email;
      } else {
        Toast.show({
          type: "error",
          text1: "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ที่ถูกต้อง",
        });
        setLoading(false);
        return;
      }

      const res = await loginWithEmail(loginData);
      if (res.accessToken) {
        await AsyncStorage.setItem("accessToken", res.accessToken);
        Toast.show({ text1: "Login สำเร็จ" });
        setTimeout(() => {
          setLoading(false);
          router.replace("/");
        }, 1200);
      } else {
        Toast.show({
          text1: "เข้าสู่ระบบไม่สำเร็จ",
          text2: res.message || "",
        });
        setLoading(false);
      }
    } catch (e: any) {
      //console.log("login error:", e);
      Toast.show({ text1: e.message || "Login ไม่สำเร็จ" });
      setLoading(false);
      setError(e.message);
    }
  };

  // =========================
  // Google Login
  // =========================
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await promptAsync();
      //console.log("Google login result:", result.authentication?.accessToken);

      if (result.type === "success" && result.authentication?.accessToken) {
        const accessToken = result.authentication.accessToken;
        // Try to get user's name from response
        const name =
          result?.user?.name ||
          result?.params?.name ||
          result?.extraParams?.name ||
          ""; // fallback if not found

        await tryGoogleLogin(accessToken, undefined, name);
      } else {
        Toast.show({ text1: "Google Login ถูกยกเลิกหรือผิดพลาด" });
        setLoading(false);
      }
    } catch (e: any) {
      console.error("Google login error:", e);
      Toast.show({ text1: e.message || "Google Login ไม่สำเร็จ" });
      setLoading(false);
      setError(e.message);
    }
  };

  const tryGoogleLogin = async (
    accessToken: string,
    phone?: string,
    name?: string
  ) => {
    try {
      const res = await loginWithGoogle({
        accessToken: accessToken,
        ...(phone && { phone }),
        ...(name && { name }),
      });

      //console.log("Google login response:", res);

      if (res.accessToken) {
        await AsyncStorage.setItem("accessToken", res.accessToken);
        Toast.show({ text1: "Login ด้วย Google สำเร็จ" });
        setTimeout(() => {
          setLoading(false);
          setShowPhoneModal(false);
          setPhoneNumber("");
          setGoogleAccessToken(null);
          setGoogleName(""); // <-- Reset name
          router.replace("/");
        }, 1200);
      } else if (
        res.reason === "PHONE_REQUIRED_FOR_NEW_ACCOUNT" ||
        res.reason === "NAME_REQUIRED_FOR_NEW_ACCOUNT"
      ) {
        setGoogleAccessToken(accessToken);
        setShowPhoneModal(true);
        setLoading(false);
        // If name is returned from Google, set it as default
        if (name) setGoogleName(name);
      } else {
        Toast.show({
          text1: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ",
          text2: res.message || res.reason || "",
        });
        setLoading(false);
      }
    } catch (e: any) {
      console.error("Google login error:", e);
      Toast.show({ text1: e.message || "Google Login ไม่สำเร็จ" });
      setLoading(false);
      setError(e.message);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกเบอร์โทรศัพท์",
      });
      return;
    }
    if (!googleName.trim()) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกชื่อ",
      });
      return;
    }

    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง",
      });
      return;
    }

    if (googleAccessToken) {
      setLoading(true);
      await tryGoogleLogin(googleAccessToken, phoneNumber, googleName);
    }
  };

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneNumber("");
    setGoogleAccessToken(null);
    setGoogleName(""); // <-- Reset name
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Logo */}
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Image
          source={require("../assets/images/Mumya_logo.jpg")}
          style={{ width: 120, height: 120, marginBottom: 10 }}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Login here</Text>
        <Text style={{ fontSize: 16, color: "#555", marginTop: 4 }}>
          Welcome to Mumya Pharmacy
        </Text>
      </View>

      {/* Form */}
      <View style={{ padding: 24 }}>
        <TextInput
          placeholder="email or phone number"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: "#bbb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: "#f9f9f9",
          }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#bbb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: "#f9f9f9",
          }}
        />

        {/* Normal Login */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#80cbc4" : "#0097a7",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 12,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign up */}
        <View
          style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}
        >
          <Text>Create new account </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={{ color: "#0097a7", fontWeight: "bold" }}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Or Google */}
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text style={{ color: "#0097a7" }}>Or continue with</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#fff",
            borderColor: "#0097a7",
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={handleGoogleLogin}
          disabled={!request}
        >
          <Text style={{ color: "#0097a7", fontWeight: "bold", fontSize: 16 }}>
            Google
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone Number Modal */}
      <Modal
        visible={showPhoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closePhoneModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              กรอกเบอร์โทรศัพท์และชื่อ
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              กรุณากรอกเบอร์โทรศัพท์และชื่อเพื่อสร้างบัญชีใหม่
            </Text>

            <TextInput
              placeholder="เบอร์โทรศัพท์"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: '#bbb',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 16,
              }}
            />

            <TextInput
              placeholder="ชื่อ"
              value={googleName}
              onChangeText={setGoogleName}
              style={{
                borderWidth: 1,
                borderColor: '#bbb',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 16,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#ccc',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 8,
                }}
                onPress={closePhoneModal}
                disabled={loading}
              >
                <Text style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#666',
                }}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: loading ? "#80cbc4" : "#0097a7",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 8,
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handlePhoneSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    ยืนยัน
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}
