import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const PassSuccess: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef4ff 0%, #f9fbff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={11} sm={8} md={6} lg={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="p-4 text-center">
                {/* Success icon */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "#d1fae5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: 36,
                  }}
                >
                  ✓
                </div>

                <h4 className="fw-bold text-dark mb-2">Password Reset!</h4>
                <p className="text-muted small mb-4">
                  Your password has been updated successfully. You can now log in
                  with your new password.
                </p>

                <Link to="/" className="btn btn-primary w-100 fw-semibold py-2">
                  Back to Login
                </Link>
              </Card.Body>

              <Card.Footer className="text-center small text-muted bg-white border-0 py-3">
                © {new Date().getFullYear()} Ev info Admin. All rights reserved.
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PassSuccess;
