import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'react-native';

export default function PrivacyPolicyPage() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/Mumya_logo.jpg')} // Replace with your logo file path
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Effective Date: 09 October 2025</Text>

      <Text style={styles.sectionTitle}>Your Privacy</Text>
      <Text style={styles.text}>
        Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our app.
      </Text>

      <Text style={styles.sectionTitle}>Information We Collect</Text>
      <Text style={styles.text}>
        We may collect the following types of information:
      </Text>
      <Text style={styles.text}>
        - Personal information (e.g., name, email, phone number).
      </Text>
      <Text style={styles.text}>
        - Device information (e.g., IP address, operating system).
      </Text>
      <Text style={styles.text}>
        - Usage data (e.g., app interactions, preferences).
      </Text>

      <Text style={styles.sectionTitle}>How We Use Your Information</Text>
      <Text style={styles.text}>
        We use your information to:
      </Text>
      <Text style={styles.text}>
        - Provide and improve our services.
      </Text>
      <Text style={styles.text}>
        - Communicate with you.
      </Text>
      <Text style={styles.text}>
        - Ensure the security of our app.
      </Text>

      <Text style={styles.sectionTitle}>Sharing Your Information</Text>
      <Text style={styles.text}>
        We do not share your information with third parties except as required by law or to provide our services.
      </Text>

      <Text style={styles.sectionTitle}>Your Rights</Text>
      <Text style={styles.text}>
        You have the right to access, update, or delete your personal information. Contact us at mumyapharmacy.app@gmail.com for assistance.
      </Text>

      <Text style={styles.sectionTitle}>Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions about this Privacy Policy, please contact us at:
      </Text>
      <Text style={styles.text}>
        Email: mumyapharmacy.app@gmail.com
      </Text>

      <Text style={styles.text}>Thank you for using our app!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100, // Adjust size as needed
    borderRadius: 50, // Makes the image circular
  },
});