// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { getUserProfile } from '../composables/fetchAPI';

// type UserType = any; // You can define a more specific type if you want

// export const UserContext = createContext<{
//   user: UserType;
//   setUser: React.Dispatch<React.SetStateAction<UserType>>;
// }>({
//   user: null,
//   setUser: () => {},
// });

// export const useUser = () => useContext(UserContext);

// export const UserProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<UserType>(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const data = await getUserProfile();
//         setUser(data);
//       } catch (e) {
//         setUser(null);
//       }
//     };
//     fetchUser();
//   }, []);

//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };