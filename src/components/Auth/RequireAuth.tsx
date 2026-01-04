import { useState } from "react";
import { getLocalStorage } from "../../utils";
import { Outlet, Navigate, useLocation } from "react-router-dom";

const RequireAuth = ({ allowedRoles }: any) => {
  const [user] = useState(() => getLocalStorage("initialData"));
  const location = useLocation();

  return user?.role?.find((role: any) => allowedRoles?.includes(role)) ? (
    <Outlet />
  ) : user?.role[0] ? (
    <Navigate to="/unauthorized" state={{ from: location }} replace />
  ) : (
    <Navigate to="/auth" state={{ from: location }} replace />
  );
};

export default RequireAuth;
