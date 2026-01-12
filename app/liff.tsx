import liff from "@line/liff";
import { useRouter } from "expo-router"; // Import useRouter
import React, { useEffect, useState } from "react";
import { loginWithLine } from "../composables/fetchAPI"; // Import loginWithLine

const LIFF_ID = "2008830229-zB6baKSH"; // LIFF ID จาก LINE Developers Console

export default function Liff() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    async function initLiff() {
      try {
        await liff.init({ liffId: LIFF_ID });

        // ดึง redirect parameter จาก URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect");
        console.log("Redirect Parameter:", redirect);

        // เก็บ redirect parameter ไว้ใน localStorage
        if (redirect) {
          localStorage.setItem("redirectUrl", redirect);
        }

        if (!liff.isLoggedIn()) {
          liff.login(); // Redirect ไปหน้า Login ของ LINE
        } else {
          const token = liff.getAccessToken();
          setAccessToken(token); // เก็บ accessToken ใน state
          console.log("LIFF Access Token:", token);

          // ใช้ loginWithLine เพื่อส่ง accessToken ไปยัง API
          const response = await loginWithLine({ accessToken: token });
          console.log("API Response:", response);

          // เก็บ accessToken ที่ได้จาก API response ไว้ใน localStorage
          if (response && response.accessToken) {
            localStorage.setItem("accessToken", response.accessToken);
          }

          const profile = await liff.getProfile();
          console.log("User Profile:", profile);

          // ดึง redirect parameter จาก localStorage
          const storedRedirect = localStorage.getItem("redirectUrl");
          setRedirectUrl(storedRedirect);

          // ลบ redirect parameter จาก localStorage หลังใช้งาน
          localStorage.removeItem("redirectUrl");
        }
      } catch (error) {
        console.error("LIFF Initialization Error:", error);
      }
    }

    initLiff();
  }, []);

  useEffect(() => {
    // Redirect ไปยัง path ที่ระบุใน redirectUrl
    if (redirectUrl) {
      if (redirectUrl === "news") {
        router.replace("/"); // Redirect ไปที่หน้าแรก
      } else {
        router.replace(`/${redirectUrl}`); // Redirect ไป path ที่ระบุ
      }
    }
  }, [redirectUrl]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      {(!redirectUrl || !accessToken) ? (
        <p>Loading...</p> // แสดงข้อความ Loading ตรงกลางจอ
      ) : null}
    </div>
  );
}

