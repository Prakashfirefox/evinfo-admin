import { Outlet, useLocation } from "react-router-dom";

const Layout = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/greeting" ||
      location.pathname === "/unauthorized" ||
      location.pathname === "/404" ? null : (
        <div className="mainWrap"></div>
      )}

      <div className="main-wrap">
            <Outlet />
      </div>
    </>
  );
};

export default Layout;

