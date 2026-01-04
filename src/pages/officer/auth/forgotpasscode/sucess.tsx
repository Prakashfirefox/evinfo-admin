import { Button } from "react-bootstrap";
import LoginLeftSide from  "../../../../components/Auth/SignIn/Index";
import { Nav } from "react-bootstrap";
// import Tick from "../../../../assets/images/success-tick.svg";

export default function sucess() {
  return (
    <>
      <div className="loginPageCenter">
        <div className="loginPageWrapper">
          <LoginLeftSide/>
          {/* <div className="loginPageRight">
            {loaderStatus == 0 && (
              <div className="pageLoader">
                <span className="spinner"></span>
              </div>
            )} */}
            <div className="loginPageRight">
              <div className="loginrightForm">
                      <div className="contentFromSuccess">
                          <img src="../../../../assets/images/success-tick.svg" alt="tick" className="successTick"/>
                          <h2>Great</h2>
                          <p className="subtext">Your Password has been reseted <br/>successfully</p> 
                      </div>
              
                    {/* {error && <p className="text-danger">{error}</p>} */}
                    
                    <div className="submitBtn-wrap mt-4">
                      <Nav.Link href="/auth2" className="btnw-100 text-start btn btn-primary">Back to Login</Nav.Link> 
                    </div> 
                </div>
            </div>
            </div>
          </div>
    

    </>
  )
}
