import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import { logout } from "../../service/common.service";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("User");

  /**
   * ✅ Get user name from localStorage
   */
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed?.name) {
          setUserName(parsed.name);
        }
      } catch (err) {
        console.error("Failed to parse userData:", err);
      }
    }
  }, []);


  /**
   * ✅ API: Logout user
   */
  const handleSignOut = async () => {
    try {
      const userData = localStorage.getItem("userData");
      const token = userData ? JSON.parse(userData)?.access_token : null;

      // Optional: Call your backend logout endpoint
      await logout();

      // ✅ Clear local storage
      localStorage.removeItem("userData");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("login");

      // ✅ Redirect to login page
      navigate("/");

    } catch (error: unknown) {
      console.error("Logout failed:", error);
      // Even if API fails, ensure user is logged out
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <nav
      id="sidenav-main"
      className={`sidenav navbar navbar-vertical fixed-left navbar-expand-xs navbar-light bg-white d-flex flex-column shadow-sm ${isCollapsed ? "collapsed" : ""
        }`}
    >
      <div className="scrollbar-inner flex-grow-1 d-flex flex-column">
        <div className="navbar-inner flex-grow-1 d-flex flex-column">
          <div
            className="collapse navbar-collapse flex-grow-1 d-flex flex-column"
            id="sidenav-collapse-main"
          >
            <ul className="navbar-nav flex-column flex-grow-1 px-2" id="navDrop">
              <li className="nav-item">
                <Nav.Link
                  href="/dashboard"
                  className="nav-link d-flex align-items-center my-2"
                >
                  <i className="bi bi-speedometer2"></i>
                  {!isCollapsed && (
                    <span className="nav-link-text ms-2">Dashboard</span>
                  )}
                </Nav.Link>
              </li>

              <li className="nav-item">
                <Nav.Link
                  href="/lead-management"
                  className="nav-link d-flex align-items-center my-2"
                >
                  <i className="bi bi-people"></i>
                  {!isCollapsed && (
                    <span className="nav-link-text ms-2">
                      Banner
                    </span>
                  )}
                </Nav.Link>
              </li>

              {/* <li className="nav-item">
                <Nav.Link
                  href="#"
                  className="nav-link d-flex align-items-center my-2"
                >
                  <i className="bi bi-buildings"></i>
                  {!isCollapsed && (
                    <span className="nav-link-text ms-2">Organizations</span>
                  )}
                </Nav.Link>
              </li> */}

              <li className="nav-item">
                <Nav.Link
                  href="/framework"
                  className="nav-link d-flex align-items-center my-2"
                >
                  <i className="bi bi-diagram-3"></i>
                  {!isCollapsed && (
                    <span className="nav-link-text ms-2">
                      Blogs
                    </span>
                  )}
                </Nav.Link>
              </li>
            </ul>

            {/* ✅ Footer Section with Sign Out */}
            <div className="sidebar-footer p-3 mt-auto">
              <div className="d-flex mb-2">
                <div
                  className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-2"
                  style={{ width: "35px", height: "35px" }}
                >
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                {!isCollapsed && (
                  <div>
                    <strong className="d-block small text-dark">{userName}</strong>
                    <small className="text-muted">Super Admin</small>
                  </div>
                )}
              </div>

              <Nav.Link
                as="button"
                onClick={handleSignOut}
                className="nav-link d-flex align-items-center bg-transparent border-0 p-0"
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                {!isCollapsed && <span>Sign Out</span>}
              </Nav.Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
