import React, { useState } from "react";
import {
  Container, Row, Col, Card, Form, Button, Spinner, Alert,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../../../service/common.service";

interface ResetPasswordForm {
  new_password: string;
  confirm_password: string;
}

const NewPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const passwordValue = watch("new_password");

  // Guard: if token or email is missing from URL, show error
  if (!token || !email) {
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
                  <div style={{ fontSize: 40 }}>⚠️</div>
                  <h5 className="fw-bold mt-2">Invalid Reset Link</h5>
                  <p className="text-muted small">
                    This password reset link is invalid or has already been used.
                  </p>
                  <Link to="/forgot-password" className="btn btn-primary w-100 fw-semibold py-2 mt-2">
                    Request a New Link
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const res = await resetPassword(token, email, data.new_password);
      if (res && res.data?.status) {
        navigate("/success-page");
      } else {
        const msg = res?.data?.message || "Failed to reset password. The link may have expired.";
        toast.error(msg);
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
                  <h4 className="fw-bold text-dark mb-1">Set New Password</h4>
                  <p className="text-muted small">
                    Resetting password for <strong>{decodeURIComponent(email)}</strong>
                  </p>
                </div>

                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* New Password */}
                  <Form.Group className="mb-3" controlId="new_password">
                    <Form.Label>New Password</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 chars, upper, lower, number, special"
                        {...register("new_password", {
                          required: "New password is required",
                          minLength: { value: 8, message: "At least 8 characters" },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                            message: "Must include uppercase, lowercase, number & special character",
                          },
                        })}
                        isInvalid={!!errors.new_password}
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.new_password?.message}
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-4" controlId="confirm_password">
                    <Form.Label>Confirm Password</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        {...register("confirm_password", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === passwordValue || "Passwords do not match",
                        })}
                        isInvalid={!!errors.confirm_password}
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        tabIndex={-1}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.confirm_password?.message}
                      </Form.Control.Feedback>
                    </div>
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </Form>
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

export default NewPassword;
