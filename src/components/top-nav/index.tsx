import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const Header: React.FC = () => {
  return (
    <Navbar
      bg="light"
      expand="lg"
      fixed="top"
      className="shadow-sm border-bottom mainTopNav"
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <img
            src="../../assets/images/logo.png"
            alt="clear-align"
            height="35"
            className="navbar-brand-img"
          />
        </Navbar.Brand>

        <Nav className="ms-auto align-items-center">
          <Nav.Link href="#" className="text-dark">
            <i className="bi bi-gear fs-4"></i>
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;
