import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { loginWithGoogle, loginWithLine } from "../../composables/fetchAPI";
import * as WebBrowser from "expo-web-browser";


const exchangeCodeForAccessToken = async (code: string) => {
  try {
    console.log("Exchanging code for access token:", code); // Log code
    const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:8081/auth/callback",
        client_id: "2008830229",
        client_secret: "2f690ccb3165a8b837d355c52b208f3d",
      }).toString(),
    });

    // if (!response.ok) {
    //   const errorResponse = await response.json();
    //   console.error("LINE API Error Response:", errorResponse); // Log error response
    //   throw new Error("Failed to exchange code for access token");
    // }

    const tokenResponse = await response.json();
    console.log("Token Response:", tokenResponse); // Log token response
    return tokenResponse;
  } catch (error) {
    console.error("Exchange Code Error:", error); // Log error
    throw error;
  }
};

export default function AuthCallback() {
  const router = useRouter();
  const queryParams = new URLSearchParams(window.location.search);
  const access_token = queryParams.get("access_token");
  const code = queryParams.get("code"); // รับ code จาก LINE

  useEffect(() => {
    const handleGoogleCallback = async () => {
      if (!access_token) {
        Toast.show({ text1: "Google Login ไม่สำเร็จ" });
        router.replace("/login");
        return;
      }

      try {
        const res = await loginWithGoogle({ accessToken: access_token });

        if (res.accessToken) {
          await AsyncStorage.setItem("accessToken", res.accessToken);
          Toast.show({ text1: "Login ด้วย Google สำเร็จ" });
          router.replace("/");
        } else {
          Toast.show({
            text1: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ",
            text2: res.message || res.reason || "",
          });
          router.replace("/login");
        }
      } catch (e: any) {
        Toast.show({ text1: e.message || "Google Login ไม่สำเร็จ" });
        router.replace("/login");
      }
    };

    const handleLineCallback = async () => {
      if (!code) {
        Toast.show({ text1: "LINE Login ไม่สำเร็จ" });
        router.replace("/login");
        WebBrowser.dismissBrowser(); // ปิด popup

        return;
      }

      try {
        // แลกเปลี่ยน code เป็น accessToken
        const tokenResponse = await exchangeCodeForAccessToken(code);
        const accessToken = tokenResponse.access_token;

        if (!accessToken) {
          Toast.show({ text1: "LINE Login ไม่สำเร็จ", text2: "ไม่สามารถรับ accessToken ได้" });
          router.replace("/login");
          WebBrowser.dismissBrowser(); // ปิด popup
          return;
        }

        const res = await loginWithLine({ accessToken });

        if (res.accessToken) {
          await AsyncStorage.setItem("accessToken", res.accessToken);
          Toast.show({ text1: "Login ด้วย LINE สำเร็จ" });
          router.replace("/");
          WebBrowser.dismissBrowser(); // ปิด popup
        } else {
          Toast.show({
            text1: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ",
            text2: res.message || res.reason || "",
          
          });
          router.replace("/login");
          WebBrowser.dismissBrowser(); // ปิด popup
        }
      } catch (e: any) {
        Toast.show({ text1: e.message || "LINE Login ไม่สำเร็จ" });
        router.replace("/login");
        WebBrowser.dismissBrowser(); // ปิด popup
      }
    };

    // เรียกฟังก์ชันตามประเภทการเข้าสู่ระบบ
    if (code) {
      handleLineCallback();
    } else if (access_token) {
      handleGoogleCallback();
    } else {
      // กรณีไม่มี access_token หรือ code
      Toast.show({ text1: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" });
      router.replace("/login");
    }
  }, [access_token, code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0097a7" />
      <Text style={{ marginTop: 16 }}>กำลังเข้าสู่ระบบ...</Text>
    </View>
  );
}