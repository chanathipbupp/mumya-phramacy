import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile } from '../composables/fetchAPI';

const UserContext = createContext<any>(null);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getUserProfile();
        setUser(profile);
        //console.log('Fetched user profile:', profile);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    //console.log('UserProvider mounted, fetching user...',user);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
}