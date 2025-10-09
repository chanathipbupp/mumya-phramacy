import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile,refreshToken } from '../composables/fetchAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext<any>(null);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null); // Track token changes

  const fetchUser = async () => {
    setLoading(true); // Set loading state to true while fetching
    try {
      const profile = await getUserProfile();
      setUser(profile);
      // console.log('Fetched user profile:', profile);
    } catch (error: any) {
      if (error.response?.status === 401) { // Handle 401 Unauthorized
        // console.log('Access token expired, refreshing token...');
        try {
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          if (storedRefreshToken) {
            const refreshedToken = await refreshToken(storedRefreshToken); // Refresh the token
            await AsyncStorage.setItem('accessToken', refreshedToken.accessToken); // Update access token
            setToken(refreshedToken.accessToken); // Update token state
            await fetchUser(); // Retry fetching the user profile
          } else {
            console.error('No refresh token found, logging out...');
            setUser(null);
            await AsyncStorage.removeItem('accessToken'); // Clear access token
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          setUser(null);
          await AsyncStorage.removeItem('accessToken'); // Clear access token
        }
      } else {
        console.error('Failed to fetch user profile:', error);
        setUser(null);
      }
    } finally {
      setLoading(false); // Set loading state to false after fetching
    }
  };

  // Monitor token changes and fetch user profile
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (storedToken !== token) {
          setToken(storedToken); // Update token state
          fetchUser(); // Fetch user profile when token changes
        }
      } catch (e) {
        console.error('Failed to check token:', e);
      }
    };

    const interval = setInterval(checkToken, 1000); // Check token every second
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [token]);
  
 useEffect(() => {
    fetchUser(); // Fetch user profile on initial mount
  }, []);

  // Monitor token changes and fetch user profile
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (storedToken !== token) {
          setToken(storedToken); // Update token state
          fetchUser(); // Fetch user profile when token changes
        }
      } catch (e) {
        console.error('Failed to check token:', e);
      }
    };

    const interval = setInterval(checkToken, 1000); // Check token every second
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [token]);
  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
}