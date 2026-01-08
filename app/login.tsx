import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { loginWithEmail, loginWithGoogle, loginWithLine } from "../composables/fetchAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
// import LineLogin, { LoginPermission } from '@xmartlabs/react-native-line'


WebBrowser.maybeCompleteAuthSession();

export const screenOptions = {
  headerShown: false,
};

const LINE_CLIENT_ID = "2008830229"; // Channel ID จาก LINE Developers Console
const LINE_REDIRECT_URI = "https://mumyapharmacy.app";
const LINE_AUTH_URL = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${LINE_REDIRECT_URI}&state=12345abcde&scope=profile%20openid%20email`;
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
  const [lineName, setLineName] = useState(""); // สำหรับ LINE
  const [lineAccessToken, setLineAccessToken] = useState<string | null>(null);
  // 👇 Google OAuth Config
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    // androidClientId: "1084156198587-oni77l00r1ec2totlvid7ah34fneghad.apps.googleusercontent.com", // Add your Android Client ID here
    webClientId:
      "1084156198587-195hlgjemnh15ucqn7bi9mbqh697cu2s.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"],
    redirectUri: "https://mumyapharmacy.app/auth/callback",
  });
  const exchangeCodeForAccessToken = async (code: string): Promise<string> => {
    try {
      const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: LINE_REDIRECT_URI,
          client_id: LINE_CLIENT_ID,
          client_secret: "2f690ccb3165a8b837d355c52b208f3d",
        }).toString(),
      });
      console.log("LINE Token Response Status:", response.status, response); // Log status

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("LINE API Error Response:", errorResponse);
        throw new Error(errorResponse.error_description || "Failed to exchange code for access token");
      }

      const tokenResponse = await response.json();
      console.log("Token Response:", tokenResponse); // Log token response
      if (!tokenResponse.access_token || tokenResponse.token_type !== "Bearer") {
        throw new Error("Invalid token response from LINE API");
      }

      return tokenResponse.access_token;
    } catch (error) {
      console.error("Exchange Code Error:", error);
      throw new Error(error.message || "An error occurred while exchanging code for access token");
    }
  };
  const handleLineLogin = async () => {
    try {
      const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_REDIRECT_URI)}&state=12345abcde&scope=profile%20openid%20email`;
      const result = await WebBrowser.openAuthSessionAsync(url, LINE_REDIRECT_URI);
      console.log("LINE login result:", result);

      if (result.type === "success" && result.url) {
        const queryParams = new URLSearchParams(new URL(result.url).search);
        const code = queryParams.get("code");

        if (code) {
          setLoading(true);
          console.log("LINE Authorization Code:", code);

          const accessToken = await exchangeCodeForAccessToken(code);
          console.log("LINE Access Token:", accessToken);

          if (accessToken) {
            await tryLineLogin(accessToken);
          } else {
            Toast.show({ text1: "LINE Login ไม่สำเร็จ", text2: "ไม่สามารถรับ accessToken ได้" });
            setLoading(false);
          }
        } else {
          Toast.show({ text1: "LINE Login ไม่สำเร็จ", text2: "ไม่พบ code" });
        }
      } else {
        Toast.show({ text1: "LINE Login ถูกยกเลิกหรือผิดพลาด" });
      }
    } catch (error: any) {
      console.error("LINE Login Error:", error.message);
      Toast.show({
        text1: "LINE Login ไม่สำเร็จ",
        text2: error.message || "เกิดข้อผิดพลาด",
      });
    }
  };

  const tryLineLogin = async (accessToken: string, phone?: string, name?: string) => {
    try {
      console.log("Trying LINE login with accessToken:", accessToken);

      const res = await loginWithLine({
        accessToken,
        ...(phone && { phone }),
        ...(name && { name }),
      });

      console.log("Response from loginWithLine:", res);

      if (res.accessToken) {
        // บันทึก accessToken ลงใน AsyncStorage
        await AsyncStorage.setItem("accessToken", res.accessToken);
        Toast.show({ text1: "Login ด้วย LINE สำเร็จ" });
        setTimeout(() => {
          setLoading(false);
          setShowPhoneModal(false);
          setPhoneNumber("");
          setLineAccessToken(null); // Reset LINE access token
          setLineName(""); // Reset LINE name
          router.replace("/");
        }, 1200);
      } else if (
        res.reason === "PHONE_REQUIRED_FOR_NEW_ACCOUNT" ||
        res.reason === "NAME_REQUIRED_FOR_NEW_ACCOUNT"
      ) {
        // กรณีที่ต้องการข้อมูลเพิ่มเติม เช่น เบอร์โทรศัพท์หรือชื่อ
        setLineAccessToken(accessToken); // Set LINE access token
        setShowPhoneModal(true);
        setLoading(false);
        if (name) setLineName(name); // Set default name if available
      } else {
        // กรณีที่ login ไม่สำเร็จ
        Toast.show({
          text1: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ",
          text2: res.message || res.reason || "",
        });
        setLoading(false);
      }
    } catch (e: any) {
      console.error("LINE login error:", e);
      Toast.show({ text1: e.message || "LINE Login ไม่สำเร็จ" });
      setLoading(false);
      setError(e.message);
    }
  };

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

    if (googleAccessToken && !googleName.trim()) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกชื่อสำหรับ Google",
      });
      return;
    }

    if (lineAccessToken && !lineName.trim()) {
      Toast.show({
        type: "error",
        text1: "กรุณากรอกชื่อสำหรับ LINE",
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

    setLoading(true);

    if (googleAccessToken) {
      await tryGoogleLogin(googleAccessToken, phoneNumber, googleName);
    } else if (lineAccessToken) {
      await tryLineLogin(lineAccessToken, phoneNumber, lineName);
    } else {
      Toast.show({
        type: "error",
        text1: "ไม่พบ accessToken",
      });
      setLoading(false);
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
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/Mumya_logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Login here</Text>
        <Text style={styles.subtitle}>
          Welcome to Mumya Pharmacy
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <TextInput
          placeholder="email or phone number"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {/* Normal Login */}
        <TouchableOpacity
          style={styles.signInButton}
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
        <View style={styles.googleContainer}>
          <Text style={styles.googleText}>Or continue with</Text>
        </View>
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={!request}
          >
            <View style={styles.googleButtonContent}>
              <Image
                source={require('../assets/images/google-logo.png')} // Google logo URL
                style={styles.googleLogo}
              />
              <Text style={styles.googleButtonText}>
                Google
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lineButton}
            onPress={handleLineLogin}
          >
            <View style={styles.lineButtonContent}>
              <Image
                source={require('../assets/images/line-logo.png')} // LINE logo URL
                style={styles.lineLogo}
              />
              <Text style={styles.lineButtonText}>
                LINE
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Page Link */}
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.privacyLink}>By logging in, you agree to our Privacy Policy.</Text>
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
              value={googleAccessToken ? googleName : lineName}
              onChangeText={(text) => {
                if (googleAccessToken) {
                  setGoogleName(text);
                } else if (lineAccessToken) {
                  setLineName(text);
                }
              }}
              style={{
                borderWidth: 1,
                borderColor: "#bbb",
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


const styles = StyleSheet.create({
  socialButtonsContainer: {
    flexDirection: "row", // Align buttons horizontally
    justifyContent: "space-between", // Add space between buttons
    width: "100%", // Full width
    marginBottom: 12, // Add spacing below
  },
  googleButton: {
    flex: 1, // Take equal space
    backgroundColor: "#fff",
    borderColor: "#0097a7",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 8, // Add spacing between Google and LINE buttons
    flexDirection: "row",
    justifyContent: "center",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleButtonText: {
    color: "#0097a7",
    fontWeight: "bold",
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16, // Add padding for responsiveness
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  formContainer: {
    width: "100%", // Make the form take full width
    maxWidth: 400, // Limit width for larger screens
    alignItems: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#0097a7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  signUpText: {
    color: "#0097a7",
    fontWeight: "bold",
  },
  googleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  googleText: {
    color: "#0097a7",
  },
  privacyLink: {
    color: '#0097a7',
    fontSize: 12,
    textAlign: 'center',
  },
  lineButton: {
    flex: 1, // Take equal space
    // backgroundColor: "#00c300", // LINE green color
    backgroundColor: "#fff",
    borderColor: "#0097a7",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  lineButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  lineButtonText: {
    color: "#0097a7",
    fontWeight: "bold",
    fontSize: 16,
  },
});