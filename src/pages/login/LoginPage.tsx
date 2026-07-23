import React, { useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Spinner,
} from "react-bootstrap";
import { useForm, FieldError } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@fontsource/poppins";
import { AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { login } from "../../service/common.service";

// Define TypeScript interface for form data
interface LoginFormData {
    email: string;
    password: string;
    remember?: boolean;
}

const LoginPage: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        try {
            // Example API call
            const response: AxiosResponse = await login(data); //  typed
            const responseData = response.data;
            if (responseData.status) {
                // const decryptedName = decryptText(encryptedName);
                const dataStore = {
                    email: responseData?.data?.user.email,
                    isEmailVerified: responseData?.data?.user.email_verified,
                    name: responseData?.data?.user.full_name,
                    userId: responseData?.data?.user.id,
                    access_token: responseData?.data?.access_token,
                    login: true,
                    refresh_token: responseData?.data?.refresh_token
                };
                console.log('dataStore>>', dataStore)
                localStorage.setItem("userData", JSON.stringify(dataStore));
                navigate("/dashboard");
            }
            else {
                console.log(responseData);
                toast.error(responseData.message);
            }

        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Login failed";
            toast.error(message);
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
                                        alt="App Logo"
                                        width={200}
                                        height={53}
                                        className="mb-2"
                                    />
                                    <h4 className="fw-bold text-dark mb-1">Welcome Back</h4>
                                    <p className="text-muted">Sign in to your account</p>
                                </div>

                                <Form onSubmit={handleSubmit(onSubmit)}>
                                    {/* Email */}
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
                                            {errors.email?.message as string}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    {/* Password */}
                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>Password</Form.Label>
                                        <div className="input-group">
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...register("password", {
                                                    required: "Password is required",
                                                    minLength: {
                                                        value: 6,
                                                        message: "Password must be at least 6 characters",
                                                    },
                                                })}
                                                isInvalid={!!errors.password}
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
                                                {errors.password?.message as string}
                                            </Form.Control.Feedback>
                                        </div>
                                    </Form.Group>

                                    {/* Remember Me + Forgot */}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Remember me"
                                            {...register("remember")}
                                        />
                                        <a
                                            href="/forgot-password"
                                            className="text-primary small text-decoration-none"
                                        >
                                            Forgot Password?
                                        </a>
                                    </div>

                                    {/* Submit */}
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
                                                Signing in...
                                            </>
                                        ) : (
                                            "Login"
                                        )}
                                    </Button>
                                </Form>
                            </Card.Body>

                            <Card.Footer className="text-center small text-muted bg-white border-0 py-3">
                                © {new Date().getFullYear()} Ev info Admin. All rights reserved.
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <ToastContainer position="top-right" autoClose={2500} />
        </div>
    );
};

export default LoginPage;
