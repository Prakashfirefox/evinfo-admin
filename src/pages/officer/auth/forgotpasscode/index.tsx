import { useState } from "react";
import { useForm } from "react-hook-form";
import { InputGroup, Form, Button } from "react-bootstrap";
import LoginLeftSide from  "../../../../components/Auth/SignIn/Index";

const ForgotPasscode = () => {
  const {
    register,
    formState: { errors, isValid },
  } = useForm({ mode: "onBlur" });
  const [showErrorModal, ] = useState(false);
  const [showSuccessModal, ] = useState(false);
  const [userName,setUserName ] = useState("");

  return (
    <>
            <div className="loginPageCenter">
              <div className="loginPageWrapper">
                <LoginLeftSide/>
                <div className="loginPageRight">
                  {/* {loaderStatus == 0 && (
                    <div className="pageLoader">
                      <span className="spinner"></span>
                    </div>
                  )} */}
                  <div className="loginrightForm">
                        <h2>Forget Password</h2>
                        <p className="subtext">Send a code to your email to reset your password</p>
                        <div className="loginFormWrap">
                        <div className="form-group">
                          <Form.Label >Email</Form.Label>
                          <InputGroup>
                            <InputGroup.Text
                              id="basic-addon1"
                              // className="icon-email"
                            ></InputGroup.Text>
                            <Form.Control
                              placeholder="Enter your Email"
                              aria-label="Username"
                              // aria-describedby="basic-addon1"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                            />
                          </InputGroup>
                        </div>

                        </div>
                        
                        {/* {error && <p className="text-danger">{error}</p>} */}
                      
                        <div className="submitBtn-wrap">
                          <Button
                            variant="primary" disabled
                            className="w-100 text-start"
                            onClick={ForgotPasscode}>
                            Request OTP 
                          </Button>
                          
                        </div> 
                        <div className="mt-3">
                          <a className="backLink" href="/auth2">Back to Login</a>
                        </div>
                        
                  </div>
              </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasscode;
