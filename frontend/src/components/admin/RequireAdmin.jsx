import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard: Chỉ cho phép user có role admin truy cập
 * User chưa đăng nhập → redirect /login
 * User đã đăng nhập nhưng không phải admin → redirect /
 */
const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Đang kiểm tra session
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-sm">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;
