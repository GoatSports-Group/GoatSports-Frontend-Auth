export const environment = {
    production: false,

    authApiUrl: process.env['NG_APP_AUTH_API_URL'] || "http://localhost:4400",
    adminApiUrl: process.env['NG_APP_ADMIN_API_URL'] || "http://localhost:4300",
    clientApiUrl: process.env['NG_APP_CLIENT_API_URL'] || "http://localhost:4200",

    apiUrl: process.env['NG_APP_API_URL'] || "http://localhost:7070",
    backendCallbackUrl: process.env['NG_APP_BACKEND_CALLBACK_URL'] || "http://localhost:7071/callback",

    keycloak: {
        url: process.env['NG_APP_KEYCLOAK_URL'] || "http://localhost:8082",
        realm: process.env['NG_APP_KEYCLOAK_REALM'] || "goatsports",
        clientId: process.env['NG_APP_KEYCLOAK_CLIENT_ID'] || "goatsports-main"
    }
};