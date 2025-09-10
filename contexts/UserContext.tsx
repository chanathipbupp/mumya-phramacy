import React, { createContext, useContext, useState, useEffect } from 'react';
import profile from '../composables/profile.json';

type UserType = typeof profile;

export const UserContext = createContext<{
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
}>({
  user: profile,
  setUser: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType>(profile);

  // You can add logic here to fetch/update user from API in the future

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>  
    );
};