import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AppLoading from "./components/Error/AppLoading";
import LoginPage from "./pages/login/LoginPage";
import Dashboard from "./pages/dashboard";
import Forgetpass from "./pages/officer/auth/forgotpasscode";
import VerifyOtp from "./pages/officer/auth/forgotpasscode/verifyotp";
import NewPass from "./pages/officer/auth/forgotpasscode/newpassword";
import PassSuccess from "./pages/officer/auth/forgotpasscode/sucess";
import Unauthorized from "./pages/unauthorized";
import Missing from "./pages/missing";
import Banners from "./pages/banners/Banners";
import Blogs from "./pages/blogs/blogs";

// ✅ Check token
const isAuthenticated = () => {
  const userData = localStorage.getItem("userData");
  if (!userData) return false;

  const parsed = JSON.parse(userData);
  return !!parsed?.access_token;
};

// ✅ Protected route wrapper
const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  return isAuthenticated() ? element : <Navigate to="/" />;
};

const App = () => {
  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forget-password" element={<Forgetpass />} />
        <Route path="/verifyotp" element={<VerifyOtp />} />
        <Route path="/new-password" element={<NewPass />} />
        <Route path="/success-page" element={<PassSuccess />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={
                // <MsalProvider instance={msalInstance}>
                  <Dashboard />
                // </MsalProvider>
              }
            />
          }
        />

        <Route
          path="/lead-management"
          element={<ProtectedRoute element={<Banners />} />}
        />

        <Route
          path="/framework"
          element={<ProtectedRoute element={<Blogs />} />}
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<Missing />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </Suspense>
  );
};

export default App;
