"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const createToken = (instance, request, body) => {
    const { grant_type: grantType, client_id: clientID, scope } = body;
    if (clientID && instance.params.clientID !== clientID) {
        return [400, "Bad request"];
    }
    let user = null;
    if (!grantType || grantType === "password") {
        const { username, password } = body;
        if (!username || !password) {
            return [400, "Bad request"];
        }
        user = instance.database.matchForPasswordGrant(username, password);
    }
    else if (grantType === "client_credentials") {
        const { username, password, client_secret: clientSecret } = body;
        if (!clientID && !username) {
            return [400, "Bad request"];
        }
        if (!clientSecret && !password) {
            return [400, "Bad request"];
        }
        // some clients specify the client ID and client secret as
        // username and password, hence the fallback
        user = instance.database.matchForClientGrant(clientID || username, clientSecret || password);
    }
    else {
        return [400, "Bad request"];
    }
    if (!user) {
        return [403, "Access denied"];
    }
    const expiresIn = 3600;
    const accessToken = instance.createBearerToken(user.profile.id, expiresIn);
    const refreshToken = instance.createBearerToken(user.profile.id, expiresIn);
    return [
        200,
        {
            access_token: accessToken,
            expires_in: expiresIn,
            refresh_expires_in: expiresIn,
            refresh_token: refreshToken,
            token_type: "bearer",
            "not-before-policy": 0,
            session_state: uuid_1.v4(),
            scope: scope || "email profile",
        },
    ];
};
exports.default = createToken;
