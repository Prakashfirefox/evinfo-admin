import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AppLoading from "./components/Error/AppLoading";
import LoginPage from "./pages/login/LoginPage";
import Dashboard from "./pages/dashboard";
import Forgetpass from "./pages/officer/auth/forgotpasscode";
import NewPass from "./pages/officer/auth/forgotpasscode/newpassword";
import PassSuccess from "./pages/officer/auth/forgotpasscode/sucess";
import Unauthorized from "./pages/unauthorized";
import Missing from "./pages/missing";
import Banners from "./pages/banners/Banners";
import Blogs from "./pages/blogs/blogs";
import Brands from "./pages/brands/Brands";
import Models from "./pages/models/Models";
import Variants from "./pages/variants/Variants";
import Vehicles from "./pages/vehicles/Vehicles";
import Dealers from "./pages/dealers/Dealers";
import Reviews from "./pages/reviews/Reviews";
import Enquiries from "./pages/enquiries/Enquiries";
import Gallery from "./pages/gallery/Gallery";

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
        {/* Step 1: user enters email */}
        <Route path="/forgot-password" element={<Forgetpass />} />
        {/* Step 2: user clicks link from email (?token=...&email=...) */}
        <Route path="/reset-password" element={<NewPass />} />
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

        <Route path="/banners" element={<ProtectedRoute element={<Banners />} />} />
        <Route path="/blogs" element={<ProtectedRoute element={<Blogs />} />} />

        <Route path="/brands" element={<ProtectedRoute element={<Brands />} />} />
        <Route path="/models" element={<ProtectedRoute element={<Models />} />} />
        <Route path="/variants" element={<ProtectedRoute element={<Variants />} />} />
        <Route path="/vehicles" element={<ProtectedRoute element={<Vehicles />} />} />
        <Route path="/dealers" element={<ProtectedRoute element={<Dealers />} />} />
        <Route path="/reviews" element={<ProtectedRoute element={<Reviews />} />} />
        <Route path="/enquiries" element={<ProtectedRoute element={<Enquiries />} />} />
        <Route path="/gallery" element={<ProtectedRoute element={<Gallery />} />} />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<Missing />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </Suspense>
  );
};

export default App;
