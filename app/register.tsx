import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '../composables/fetchAPI';
import * as Google from 'expo-auth-session/providers/google';

export const screenOptions = {
  headerShown: false,
};

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1084156198587-195hlgjemnh15ucqn7bi9mbqh697cu2s.apps.googleusercontent.com',
  });

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
     try {
      console.log(name, phone, email, password);
      const res = await registerUser({ name, phone, email, password });
      console.log('Registration successful:', res);
      if (res.ok) {
        router.replace('/login');
      } else {
        setError(res.reason || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        // handle Google registration here if needed
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0097a7' }}>Create Account</Text>
        <Text style={{ fontSize: 16, color: '#555', marginTop: 8, textAlign: 'center' }}>
          Create an account so you can explore all the Mumya Pharmacy
        </Text>
      </View>
      <View style={{ marginTop: 24 }}>
        {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
        <TextInput
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: '#bbb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#f9f9f9',
          }}
        />
        <TextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          style={{
            borderWidth: 1,
            borderColor: '#bbb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#f9f9f9',
          }}
        />
        <TextInput
          placeholder="email"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: '#bbb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#f9f9f9',
          }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#bbb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#f9f9f9',
          }}
        />
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#bbb',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#f9f9f9',
          }}
        />
        <TouchableOpacity
          style={{
            backgroundColor: '#0097a7',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 12,
          }}
          onPress={handleRegister}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign Up</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={{ color: '#0097a7', fontWeight: 'bold' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#0097a7' }}>Or continue with</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#fff',
            borderColor: '#0097a7',
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 12,
          }}
          onPress={handleGoogleLogin}
        >
          <Text style={{ color: '#0097a7', fontWeight: 'bold', fontSize: 16 }}>Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}