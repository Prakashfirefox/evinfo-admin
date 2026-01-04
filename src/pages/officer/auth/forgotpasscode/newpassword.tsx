import React from 'react'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { InputGroup, Form, Button } from "react-bootstrap";
import LoginLeftSide from  "../../../../components/Auth/SignIn/Index";

export default function NewPassword() {
     const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prevState) => !prevState);
    }
  return (
    <>
        <div className="loginPageCenter">
            <div className="loginPageWrapper">
                <LoginLeftSide/>
                <div className="loginPageRight">
                  <div className="loginrightForm">
                  <h2>Set a New Password</h2>
                  <p className="subtext">Password must be atleast 8 characters</p>
                  <div className="loginFormWrap">
                   <div className="form-group"> 
                     <Form.Label >New Password</Form.Label>
                    <InputGroup>
                       <InputGroup.Text
                         id="basic-addon2"
                        // className="icon-password"
                      ></InputGroup.Text>
                      <Form.Control
                        placeholder="Enter your Password"
                        aria-label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <InputGroup.Text
                        id="basic-addon1"
                        className={
                          showPassword
                            ? "icon-table-eye cursor-pointer"
                            : "icon-eye-close cursor-pointer"
                        }
                        onClick={togglePasswordVisibility}
                      ></InputGroup.Text>
                    </InputGroup>
                  </div> 
                  <div className="form-group"> 
                    <Form.Label >Confirm Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text
                        id="basic-addon2"
                        // className="icon-password"
                      ></InputGroup.Text>
                      <Form.Control
                        placeholder="Enter your Password"
                        aria-label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <InputGroup.Text
                        id="basic-addon1"
                        className={
                          showPassword
                            ? "icon-table-eye cursor-pointer"
                            : "icon-eye-close cursor-pointer"
                        }
                        onClick={togglePasswordVisibility}
                      ></InputGroup.Text>
                    </InputGroup>
                  </div> 
                  {/* {error && <p className="text-danger">{error}</p>} */}
                  
                  <div className="submitBtn-wrap">
                    <Button
                      variant="primary"
                      className="w-100 text-start"
                    //   onClick={handleLogin}
                    >
                      Change Password 
                    </Button>
                    
                    
                  </div> 
                    <div className="mt-3">
                      <a className="backLink" href="/auth2">Back to Login</a>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

    </>
  )
}