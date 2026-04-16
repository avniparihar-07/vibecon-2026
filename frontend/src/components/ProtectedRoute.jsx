import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('vibecon_admin_auth') === 'true';
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
