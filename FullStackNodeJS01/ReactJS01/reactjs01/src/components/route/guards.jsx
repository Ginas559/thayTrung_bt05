import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

const RequireAdmin = ({ children }) => {
    const { auth } = useContext(AuthContext);

    if (!auth?.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (auth?.user?.role !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

const RequireAdminOrStaff = ({ children }) => {
    const { auth } = useContext(AuthContext);

    if (!auth?.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!['Admin', 'Moderator'].includes(auth?.user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export { RequireAdmin, RequireAdminOrStaff };
