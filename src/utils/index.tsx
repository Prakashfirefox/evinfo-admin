
import { persistor } from "../app/store";
import CryptoJS from "crypto-js";

export function retry(fn: any, retriesLeft = 5, interval = 1000) {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: any) => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error);
            return;
          }
          retry(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
}

export function setLocalStorage(key: any, value: any) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log("Item or key not provided");
  }
}

export function getLocalStorage(key: any) {
  try {
    const value: any = window.localStorage.getItem(key);
    return JSON.parse(value);
  } catch (e) {
    console.log("Item or key not provided");
  }
}

export function deleteStorage(key: any) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.log("Item or key not provided");
  }
}

let censorWord = function (str: any) {
  return str[0] + "*".repeat(str.length - 2) + str.slice(-1);
};

export const censorEmail = (email: any) => {
  var arr = email.split("@");
  return censorWord(arr[0]) + "@" + censorWord(arr[1]);
};


export const logOutEffect = () => {
  persistor.pause();
  persistor.flush().then(() => {
    persistor.purge();
    window.location.href = "/auth";
  });
};



const secretKeyBase64 = "DJpRPQBJgN40y4GpXfvasXtYuh4c57aKzZ53mgjHe/Y=";
const ivBase64 = "jYyT1MDp19+RkAho6cbeDw==";

export const decryptText = (encryptedText: string) => {
  try {
    const key = CryptoJS.enc.Base64.parse(secretKeyBase64);
    const iv = CryptoJS.enc.Base64.parse(ivBase64);

    const bytes = CryptoJS.AES.decrypt(encryptedText, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};
