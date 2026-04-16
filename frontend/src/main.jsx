import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Landing from './pages/Landing.jsx';
import Guide from './pages/Guide.jsx';
import WallInteract from './pages/WallInteract.jsx';
import Login from './pages/Login.jsx';
import Wall from './pages/Wall.jsx';
import Admin from './pages/Admin.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/wall-interact" element={<WallInteract />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wall" element={<Wall />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
