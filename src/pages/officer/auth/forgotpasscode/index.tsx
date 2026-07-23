import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { forgotPassword } from "../../../../service/common.service";

interface ForgotPasswordForm {
  email: string;
}

const ForgotPasscode: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const res = await forgotPassword(data.email);
      // API always returns 200 (even for unknown emails — prevents enumeration)
      if (res && res.status >= 200 && res.status < 300) {
        setSubmitted(true);
      } else {
        toast.error(res?.data?.message || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <img
                    src="../../assets/images/logo.png"
                    alt="EVinfo"
                    width={200}
                    height={53}
                    className="mb-2"
                  />
                  <h4 className="fw-bold text-dark mb-1">Forgot Password?</h4>
                  <p className="text-muted small">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                {submitted ? (
                  <Alert variant="success" className="rounded-3 text-center">
                    <div style={{ fontSize: 32 }}>✅</div>
                    <div className="fw-semibold mt-1">Check your inbox</div>
                    <div className="small text-muted mt-1">
                      If that email is registered, a reset link has been sent. It
                      expires in 15 minutes.
                    </div>
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="you@example.com"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address",
                          },
                        })}
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 fw-semibold py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </Form>
                )}
              </Card.Body>

              <Card.Footer className="text-center bg-white border-0 py-3">
                <Link to="/" className="text-primary small text-decoration-none">
                  ← Back to Login
                </Link>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ForgotPasscode;
