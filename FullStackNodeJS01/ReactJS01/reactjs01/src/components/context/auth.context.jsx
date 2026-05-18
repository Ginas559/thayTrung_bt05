import { createContext } from 'react';

const AuthContext = createContext({
    auth: { isAuthenticated: false, user: null },
    setAuth: () => {},
    appLoading: false,
    setAppLoading: () => {},
});

export { AuthContext };
