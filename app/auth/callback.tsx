import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { loginWithGoogle, loginWithLine } from "../../composables/fetchAPI";

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
        return;
      }

      try {
        const res = await loginWithLine({ accessToken: access_token });

        if (res.accessToken) {
          await AsyncStorage.setItem("accessToken", res.accessToken);
          Toast.show({ text1: "Login ด้วย LINE สำเร็จ" });
          router.replace("/");
        } else {
          Toast.show({
            text1: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ",
            text2: res.message || res.reason || "",
          });
          router.replace("/login");
        }
      } catch (e: any) {
        Toast.show({ text1: e.message || "LINE Login ไม่สำเร็จ" });
        router.replace("/login");
      }
    };


    // เรียกฟังก์ชันตามประเภทการเข้าสู่ระบบ
    if (code) {
      handleLineCallback();
    } else if (access_token) {
      handleGoogleCallback();
    }
  }, [access_token, code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0097a7" />
      <Text style={{ marginTop: 16 }}>กำลังเข้าสู่ระบบ...</Text>
    </View>
  );
}