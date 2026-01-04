import { Button } from "react-bootstrap";
import LoginLeftSide from  "../../../../components/Auth/SignIn/Index";

export default function verifyotp() {
  return (
    <>
      <div className="loginPageCenter">
        <div className="loginPageWrapper">
          <LoginLeftSide/>
            <div className="loginPageRight">
              <div className="loginrightForm">
                    <h2>Enter OTP</h2>
                    <p className="subtext">We have send the code to <strong>varundev62@gmail.com</strong></p>

                      <div className="loginFormWrap mt-3">
                        <div className="otp-container">
                          <input type="text" maxLength={1} className="otp-input" />
                          <input type="text" maxLength={1} className="otp-input" />
                          <input type="text" maxLength={1} className="otp-input" />
                          <input type="text" maxLength={1} className="otp-input" />
                          <input type="text" maxLength={1} className="otp-input" />
                          <input type="text" maxLength={1} className="otp-input" />
                          </div>
                      </div>
                    
                    <div className="mail-req">Didn't receive the email? <a href="">Click to resend</a></div>
                    

                    {/* {error && <p className="text-danger">{error}</p>} */}
                    
                    <div className="submitBtn-wrap">
                      <Button
                        variant="primary"
                        className="w-100 text-start"
                      >
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
  )
}
