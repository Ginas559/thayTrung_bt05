import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import { getAccountApi } from "./util/api";
import { useContext, useEffect } from "react";
import { AuthContext } from "./components/context/auth.context";
import { Spin } from "antd";
import { clearAuthSession, createEmptyAuthState, getAccessToken, getRefreshToken } from "./util/auth.storage";

function App() {
  const { setAuth, appLoading, setAppLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchAccount = async () => {
      setAppLoading(true);
      try {
        const hasSession = Boolean(getAccessToken() || getRefreshToken());

        if (!hasSession) {
          setAuth(createEmptyAuthState());
          return;
        }

        const res = await getAccountApi();
        if (res?.email) {
          setAuth({
            isAuthenticated: true,
            user: {
              email: res.email ?? "",
              name: res.name ?? "",
              role: res.role ?? "User"
            }
          });
        } else {
          clearAuthSession();
          setAuth(createEmptyAuthState());
        }
      } catch {
        clearAuthSession();
        setAuth(createEmptyAuthState());
      } finally {
        setAppLoading(false);
      }
    }
    fetchAccount();
  }, [setAppLoading, setAuth])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {appLoading === true ? (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spin />
        </div>
      ) : (
        <>
          <Header />
          <Outlet />
        </>
      )}
    </div>
  )
}

export default App