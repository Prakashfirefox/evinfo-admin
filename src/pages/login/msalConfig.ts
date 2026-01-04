import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
    auth: {
        clientId: process.env.REACT_APP_CLIENT_ID!,
        authority:
            // "https://login.microsoftonline.com/ac20add1-ffda-45c1-adc5-16a0db15810f",
            `${process.env.REACT_APP_CLOUD_INSTANCE!}${process.env.REACT_APP_TENANT_ID!}`,
        redirectUri:
            // "https://wms-dev-frontend-webapp.azurewebsites.net/auth",
            `${process.env.REACT_APP_WEB_PORTAL!}/auth`,

        // "https://localhost:3000/auth",
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
    scopes: ["openid", "profile", "User.Read", "Group.Read.All"],
};
