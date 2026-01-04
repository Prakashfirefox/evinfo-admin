import App from "./App";
import ReactDOM from "react-dom/client";
import "../src/assets/styles/index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { HelmetProvider } from "react-helmet-async";
import { store } from "./app/store";
import { Provider } from "react-redux";
import { RootContextProvider } from "./context/RootContext";
import { ErrorBoundary } from "react-app-error-boundary";
import AppError from "./components/Error/AppError";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <ErrorBoundary fallbackRender={AppError}>
    <Provider store={store}>
      
      <BrowserRouter>
        <AuthProvider>
          <RootContextProvider>
            <HelmetProvider>
              <Routes>
                <Route path="/*" element={<App />} />
              </Routes>
            </HelmetProvider>
          </RootContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
);
