import liff from "@line/liff";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, Modal, TextInput, ActivityIndicator } from "react-native"; // Import Modal and TextInput for popup
import { loginWithLine } from "../composables/fetchAPI";

const LIFF_ID = "2008830229-zB6baKSH"; // LIFF ID จาก LINE Developers //console

export default function Liff() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false); // State for phone modal
  const [phoneNumber, setPhoneNumber] = useState(""); // State for phone number input
  const [lineName, setLineName] = useState(""); // State for name input
  const router = useRouter(); // Initialize router

  useEffect(() => {
    async function initLiff() {
      try {
        await liff.init({ liffId: LIFF_ID });

        // ดึง redirect parameter จาก URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect");
        //console.log("Redirect Parameter:", redirect);

        // เก็บ redirect parameter ไว้ใน localStorage
        if (redirect) {
          localStorage.setItem("redirectUrl", redirect);
        }

        if (!liff.isLoggedIn()) {
          liff.login(); // Redirect ไปหน้า Login ของ LINE
        } else {
          const token = liff.getAccessToken();
          setAccessToken(token); // เก็บ accessToken ใน state
          //console.log("LIFF Access Token:", token);

          // ใช้ loginWithLine เพื่อส่ง accessToken ไปยัง API
          const response = await loginWithLine({ accessToken: token });
          // console.log("API Response:", response);

          // เก็บ accessToken ที่ได้จาก API response ไว้ใน localStorage
          if (response && response.accessToken) {
            localStorage.setItem("accessToken", response.accessToken);
          }

          if (
            response.reason === "PHONE_REQUIRED_FOR_NEW_ACCOUNT" ||
            response.reason === "NAME_REQUIRED_FOR_NEW_ACCOUNT"
          ) {
            setShowPhoneModal(true); // Show modal if phone or name is required
          } else {
            const profile = await liff.getProfile();
            //console.log("User Profile:", profile);

            // ดึง redirect parameter จาก localStorage
            const storedRedirect = localStorage.getItem("redirectUrl");
            setRedirectUrl(storedRedirect);

            // ลบ redirect parameter จาก localStorage หลังใช้งาน
            localStorage.removeItem("redirectUrl");
          }
        }
      } catch (error) {
        //console.error("LIFF Initialization Error:", error);
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

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim() || !lineName.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const response = await loginWithLine({
        accessToken,
        phone: phoneNumber,
        name: lineName,
      });

      if (response && response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        setShowPhoneModal(false);
        const storedRedirect = localStorage.getItem("redirectUrl");
        setRedirectUrl(storedRedirect);
        localStorage.removeItem("redirectUrl");
      } else {
        alert("การเข้าสู่ระบบล้มเหลว");
      }
    } catch (error) {
      console.error("Error submitting phone and name:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {(!redirectUrl || !accessToken) ? (
        <ActivityIndicator color="#59cdf0" size="large" />
      ) : null}

      {/* Phone and Name Modal */}
      {showPhoneModal && (
        <Modal
          visible={showPhoneModal}
          transparent={true}
          animationType="slide"
        >
          <div style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>


            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: 20,
                borderRadius: 10,
                width: "80%",
                maxWidth: 400,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                backgroundColor: 'white',
              }}
            >
              <h3 style={{ textAlign: "center" }}>กรุณากรอกข้อมูลเพิ่มเติม</h3>
              <TextInput
                placeholder="เบอร์โทรศัพท์"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  borderWidth: 1,
                  borderColor: '#bbb',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 16,
                  width: "100%",
                }} />
              <TextInput
                placeholder="ชื่อ"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                style={{
                  borderWidth: 1,
                  borderColor: '#bbb',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 16,
                  width: "100%",
                }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button title="ยืนยัน" onPress={handlePhoneSubmit} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

