import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './useSocket';
import Home from './pages/Home';
import Room from './pages/Room';
import Admin from './pages/Admin';

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-600 to-pink-500">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/admin/:code" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}
