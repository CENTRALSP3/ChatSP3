import { SocketProvider } from './useSocket';
import Home from './pages/Home';
import Room from './pages/Room';
import Admin from './pages/Admin';

export default function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-600 to-pink-500">
        <Home />
        <Room />
        <Admin />
      </div>
    </SocketProvider>
  );
}
