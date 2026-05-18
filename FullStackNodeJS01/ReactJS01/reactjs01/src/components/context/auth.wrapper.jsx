import { useMemo, useState } from 'react';
import { AuthContext } from './auth.context';
import { createEmptyAuthState } from '../../util/auth.storage';

const AuthWrapper = ({ children }) => {
    const [auth, setAuth] = useState(createEmptyAuthState());
    const [appLoading, setAppLoading] = useState(false);

    const value = useMemo(() => ({ auth, setAuth, appLoading, setAppLoading }), [auth, appLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthWrapper };
