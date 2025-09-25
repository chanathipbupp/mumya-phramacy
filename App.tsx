import { UserProvider } from './components/UserProvider';
import { PopupProvider } from './components/PopupProvider';
import { Slot } from 'expo-router';
export default function App() {
  return (
    <PopupProvider>
      <UserProvider>
        <Slot />
      </UserProvider>
    </PopupProvider>
  );
}