import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getLocalStorage } from "../utils/index";
const initialData = getLocalStorage("initialData");
const token = initialData?.intialData?.token;

axios.defaults.headers.common = {
  Authorization: `Bearer ${token}`,
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || "",
  headers: { Authorization: `Bearer ${token}` },
});
const reqInterceptor = (request: InternalAxiosRequestConfig<any>) => {
  request.headers.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  request.headers["Strict-Transport-Security"] =
    "max-age=63072000; includeSubDomains;preload";
  return request;
};

const handleSignout = () => {
  console.log('signout');
};

const resInterceptor = (response: AxiosResponse<any, any>) => {
  return response;
};

const resErrInterceptor = (error: any) => {
  const statusCode = error.response ? error.response.status : null;
  if (statusCode === 403) {
    handleSignout();
  }
  return Promise.reject(error);
};

axiosInstance.interceptors.request.use(reqInterceptor);
axiosInstance.interceptors.response.use(resInterceptor, resErrInterceptor);

export default axiosInstance;
