import axios, { AxiosInstance } from "axios";
import { logOutEffect } from "../utils";

class Service {
  private service: AxiosInstance;
  private token: string;

  constructor() {
    let service = axios.create();
    service.interceptors.response.use(this.handleSuccess, this.handleError);
    this.service = service;

    // FIXED: no JSON.parse, token is string
    this.token = window.localStorage.getItem("token") || "";
  }

  handleSuccess(response: any) {
    return response;
  }

  handleError = (error: any) => {
    if (
      error?.message === "Network request failed" ||
      error?.message === "Network Error"
    ) {
      console.log("Network Error", "Please check your connection", "iconNoInet");
    }

    if (error.response && error.response.status === 401) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("initialData");
      alert("Token has expired, please relogin");
      logOutEffect();
    }
    return Promise.reject(error);
  };

  // ✅ explicitly typed methods
  get(path: string, params?: any, callback?: any) {
    return this.service
      .get(path, {
        params,
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .then((response) =>
        callback ? callback(response.status, response.data) : response
      );
  }

  postMultipart(path: string, payload: any, callback?: any) {
    return this.service
      .request({
        method: "POST",
        url: path,
        data: payload,
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) =>
        callback ? callback(response.status, response.data) : response
      );
  }

  // ... (rest of your methods stay the same, just add type signatures)
}

export default new Service();
