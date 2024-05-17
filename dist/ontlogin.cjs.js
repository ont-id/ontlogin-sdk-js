
  /**
    * Copyright (C) 2021 The ontology Authors
    * This file is part of The ontology library.
    *
    * The ontology is free software: you can redistribute it and/or modify
    * it under the terms of the GNU Lesser General Public License as published by
    * the Free Software Foundation, either version 3 of the License, or
    * (at your option) any later version.
    *
    * The ontology is distributed in the hope that it will be useful,
    * but WITHOUT ANY WARRANTY; without even the implied warranty of
    * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    * GNU Lesser General Public License for more details.
    *
    * You should have received a copy of the GNU Lesser General Public License
    * along with The ontology.  If not, see <http://www.gnu.org/licenses/>.
    */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

exports.Version = void 0;
(function (Version) {
    Version["Version1"] = "1.0";
})(exports.Version || (exports.Version = {}));
exports.MessageType = void 0;
(function (MessageType) {
    MessageType["ClientHello"] = "ClientHello";
    MessageType["ServerHello"] = "ServerHello";
    MessageType["ClientResponse"] = "ClientResponse";
})(exports.MessageType || (exports.MessageType = {}));
/**
 * action enums for createAuthRequest
 */
exports.Action = void 0;
(function (Action) {
    Action[Action["IdAuth"] = 0] = "IdAuth";
    Action[Action["IdAuthAndVcAuth"] = 1] = "IdAuthAndVcAuth";
})(exports.Action || (exports.Action = {}));
exports.ErrorEnum = void 0;
(function (ErrorEnum) {
    ErrorEnum["VersionNotSupport"] = "ERR_WRONG_VERSION";
    ErrorEnum["TypeNotSupport"] = "ERR_TYPE_NOT_SUPPORTED";
    ErrorEnum["ActionNotSupport"] = "ERR_ACTION_NOT_SUPPORTED";
    ErrorEnum["UnknownError"] = "ERR_UNDEFINED";
    ErrorEnum["UserCanceled"] = "USER_CANCELED";
})(exports.ErrorEnum || (exports.ErrorEnum = {}));
exports.QrStatus = void 0;
(function (QrStatus) {
    QrStatus[QrStatus["Pending"] = 0] = "Pending";
    QrStatus[QrStatus["Success"] = 1] = "Success";
    QrStatus[QrStatus["Fail"] = 2] = "Fail";
})(exports.QrStatus || (exports.QrStatus = {}));
/**
 * Ontlogin QR server urls.
 * @beta
 */
exports.RequestUrl = void 0;
(function (RequestUrl) {
    RequestUrl["getQR"] = "https://login.ont.id/scan/qr-code/challenge";
    RequestUrl["getQRResult"] = "https://login.ont.id/scan/qr-code/result";
})(exports.RequestUrl || (exports.RequestUrl = {}));
exports.RequestUrlTest = void 0;
(function (RequestUrlTest) {
    RequestUrlTest["getQR"] = "http://172.168.3.240:31843/qr-code/challenge";
    RequestUrlTest["getQRResult"] = "http://172.168.3.240:31843/qr-code/result";
})(exports.RequestUrlTest || (exports.RequestUrlTest = {}));

/**
 * Post request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param body Request body.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
const postRequest = async (url, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
body, signal) => {
    return fetch(url, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        signal,
    }).then((res) => res.json());
};
/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
const getRequest = async (url, path, signal) => {
    return fetch(`${url}/${path}`, { signal }).then((res) => res.json());
};
/**
 * Async wait some time.
 * @param time Second amount.
 */
const wait = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

/**
 * Create AuthRequest.
 * @param action - The action type.
 * @return The AuthRequest for get AuthChallenge.
 * @example
 * ```typescript
 * const authRequest: AuthRequest = createAuthRequest(Action.IdAuthAndVcAuth);
 * ```
 */
const createAuthRequest = (action = exports.Action.IdAuth) => {
    return {
        ver: exports.Version.Version1,
        type: exports.MessageType.ClientHello,
        action,
    };
};
/**
 * Get QR with the AuthChallenge from ontologin QR server.
 * @param challenge - The AuthChallenge from your server.
 * @param url - Custom request url.
 * @return Text for generating the QR code and id for query scan result.
 * @example
 * ```typescript
 * const { text, id } = await requestQR(challenge);
 * ```
 */
const requestQR = async (challenge, url) => {
    const { result, error, desc } = await postRequest(url || exports.RequestUrl.getQR, challenge);
    if (error) {
        throw new Error(desc);
    }
    return {
        id: result.id,
        text: result.qrCode,
    };
};
let isQueryCanceled = false;
let abortController = null;
/**
 * Query QR result from ontlogin QR server until get result or error.
 * @param id - QR id.
 * @param duration - Time duration(ms) between each request(1000 by default).
 * @param url - Custom request url.
 * @return The AuthResponse for submit to server.
 */
const queryQRResult = async (id, duration = 1000, url) => {
    if (isQueryCanceled) {
        isQueryCanceled = false;
        abortController = null;
        throw new Error(exports.ErrorEnum.UserCanceled);
    }
    try {
        abortController = new AbortController();
        const { result, error, desc } = await getRequest(url || exports.RequestUrl.getQRResult, id, abortController.signal);
        if (error) {
            throw new Error(desc);
        }
        if (result.state === exports.QrStatus.Pending) {
            await wait(duration);
            return queryQRResult(id);
        }
        if (result.state === exports.QrStatus.Success) {
            return JSON.parse(result.clientResponse);
        }
        throw new Error(result.error);
    }
    catch (err) {
        if (err.name === "AbortError") {
            isQueryCanceled = false;
            abortController = null;
            throw new Error(exports.ErrorEnum.UserCanceled);
        }
        throw err;
    }
};
/**
 * Stop query QR result
 */
const cancelQueryQRResult = () => {
    isQueryCanceled = true;
    if (abortController) {
        abortController.abort();
    }
};
/**
 * Create the object for the wallet to sign.
 * @param challenge - The AuthChallenge from server.
 * @param account - Signer did.
 */
const createSignData = (challenge, account) => ({
    type: "ClientResponse",
    server: {
        name: challenge.server.name,
        url: challenge.server.url,
        ...(challenge.server.did ? { did: challenge.server.did } : {}),
    },
    nonce: challenge.nonce,
    did: account,
    created: Math.floor(Date.now() / 1000),
});
/**
 * Create the object for the wallet to sign use method eth_signTypedData_v4.
 * @param challenge - The AuthChallenge from server.
 * @param account - Signer did.
 */
const createSignData712 = (challenge, account) => ({
    types: {
        EIP712Domain: [
            {
                name: "name",
                type: "string",
            },
            {
                name: "version",
                type: "string",
            },
        ],
        ClientResponseMsg: [
            {
                name: "type",
                type: "string",
            },
            {
                name: "serverName",
                type: "string",
            },
            {
                name: "serverUrl",
                type: "string",
            },
            {
                name: "serverDid",
                type: "string",
            },
            {
                name: "nonce",
                type: "string",
            },
            {
                name: "did",
                type: "string",
            },
            {
                name: "created",
                type: "uint256",
            },
        ],
    },
    primaryType: "ClientResponseMsg",
    domain: {
        name: "ontlogin",
        version: "v1.0.0",
    },
    message: {
        type: "ClientResponse",
        serverName: challenge.server.name,
        serverUrl: challenge.server.url,
        serverDid: challenge.server.did,
        nonce: challenge.nonce,
        did: account,
        created: Math.floor(Date.now() / 1000),
    },
});

exports.cancelQueryQRResult = cancelQueryQRResult;
exports.createAuthRequest = createAuthRequest;
exports.createSignData = createSignData;
exports.createSignData712 = createSignData712;
exports.getRequest = getRequest;
exports.postRequest = postRequest;
exports.queryQRResult = queryQRResult;
exports.requestQR = requestQR;
exports.wait = wait;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBJZEF1dGggPSAwLFxuICBJZEF1dGhBbmRWY0F1dGggPSAxLFxufVxuXG5leHBvcnQgZW51bSBFcnJvckVudW0ge1xuICBWZXJzaW9uTm90U3VwcG9ydCA9IFwiRVJSX1dST05HX1ZFUlNJT05cIixcbiAgVHlwZU5vdFN1cHBvcnQgPSBcIkVSUl9UWVBFX05PVF9TVVBQT1JURURcIixcbiAgQWN0aW9uTm90U3VwcG9ydCA9IFwiRVJSX0FDVElPTl9OT1RfU1VQUE9SVEVEXCIsXG4gIFVua25vd25FcnJvciA9IFwiRVJSX1VOREVGSU5FRFwiLFxuICBVc2VyQ2FuY2VsZWQgPSBcIlVTRVJfQ0FOQ0VMRURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG4vKipcbiAqIE9udGxvZ2luIFFSIHNlcnZlciB1cmxzLlxuICogQGJldGFcbiAqL1xuZXhwb3J0IGVudW0gUmVxdWVzdFVybCB7XG4gIGdldFFSID0gXCJodHRwczovL2xvZ2luLm9udC5pZC9zY2FuL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFSUmVzdWx0ID0gXCJodHRwczovL2xvZ2luLm9udC5pZC9zY2FuL3FyLWNvZGUvcmVzdWx0XCIsXG59XG5cbmV4cG9ydCBlbnVtIFJlcXVlc3RVcmxUZXN0IHtcbiAgZ2V0UVIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFSUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLyoqXG4gKiBQb3N0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBib2R5IFJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4oXG4gIHVybDogc3RyaW5nLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyxAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGJvZHk6IGFueSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgICBzaWduYWwsXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEdldCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGF0aCBSZXF1ZXN0IHBhdGggaS5lLiAnaWQnIG9yICduZXdzL2lkJy5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIHBhdGg6IHN0cmluZyxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCwgeyBzaWduYWwgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogQXN5bmMgd2FpdCBzb21lIHRpbWUuXG4gKiBAcGFyYW0gdGltZSBTZWNvbmQgYW1vdW50LlxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBBdXRoUmVzcG9uc2UsXG4gIFFSUmVzdWx0LFxuICBTaWduRGF0YSxcbiAgU2lnbkRhdGE3MTIsXG59IGZyb20gXCIuL3R5cGVcIjtcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgRXJyb3JFbnVtLFxuICBNZXNzYWdlVHlwZSxcbiAgUXJTdGF0dXMsXG4gIFJlcXVlc3RVcmwsXG4gIFZlcnNpb24sXG59IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IGdldFJlcXVlc3QsIHBvc3RSZXF1ZXN0LCB3YWl0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3QuXG4gKiBAcGFyYW0gYWN0aW9uIC0gVGhlIGFjdGlvbiB0eXBlLlxuICogQHJldHVybiBUaGUgQXV0aFJlcXVlc3QgZm9yIGdldCBBdXRoQ2hhbGxlbmdlLlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGF1dGhSZXF1ZXN0OiBBdXRoUmVxdWVzdCA9IGNyZWF0ZUF1dGhSZXF1ZXN0KEFjdGlvbi5JZEF1dGhBbmRWY0F1dGgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVBdXRoUmVxdWVzdCA9IChcbiAgYWN0aW9uOiBBY3Rpb24gPSBBY3Rpb24uSWRBdXRoXG4pOiBBdXRoUmVxdWVzdCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmVyOiBWZXJzaW9uLlZlcnNpb24xLFxuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNsaWVudEhlbGxvLFxuICAgIGFjdGlvbixcbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IFFSIHdpdGggdGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBvbnRvbG9naW4gUVIgc2VydmVyLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20geW91ciBzZXJ2ZXIuXG4gKiBAcGFyYW0gdXJsIC0gQ3VzdG9tIHJlcXVlc3QgdXJsLlxuICogQHJldHVybiBUZXh0IGZvciBnZW5lcmF0aW5nIHRoZSBRUiBjb2RlIGFuZCBpZCBmb3IgcXVlcnkgc2NhbiByZXN1bHQuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgeyB0ZXh0LCBpZCB9ID0gYXdhaXQgcmVxdWVzdFFSKGNoYWxsZW5nZSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICB1cmw/OiBzdHJpbmdcbik6IFByb21pc2U8UVJSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBwb3N0UmVxdWVzdChcbiAgICB1cmwgfHwgUmVxdWVzdFVybC5nZXRRUixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxubGV0IGlzUXVlcnlDYW5jZWxlZCA9IGZhbHNlO1xubGV0IGFib3J0Q29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogUXVlcnkgUVIgcmVzdWx0IGZyb20gb250bG9naW4gUVIgc2VydmVyIHVudGlsIGdldCByZXN1bHQgb3IgZXJyb3IuXG4gKiBAcGFyYW0gaWQgLSBRUiBpZC5cbiAqIEBwYXJhbSBkdXJhdGlvbiAtIFRpbWUgZHVyYXRpb24obXMpIGJldHdlZW4gZWFjaCByZXF1ZXN0KDEwMDAgYnkgZGVmYXVsdCkuXG4gKiBAcGFyYW0gdXJsIC0gQ3VzdG9tIHJlcXVlc3QgdXJsLlxuICogQHJldHVybiBUaGUgQXV0aFJlc3BvbnNlIGZvciBzdWJtaXQgdG8gc2VydmVyLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlRUlJlc3VsdCA9IGFzeW5jIChcbiAgaWQ6IHN0cmluZyxcbiAgZHVyYXRpb24gPSAxMDAwLFxuICB1cmw/OiBzdHJpbmdcbik6IFByb21pc2U8QXV0aFJlc3BvbnNlPiA9PiB7XG4gIGlmIChpc1F1ZXJ5Q2FuY2VsZWQpIHtcbiAgICBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbiAgICBhYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgIHRocm93IG5ldyBFcnJvcihFcnJvckVudW0uVXNlckNhbmNlbGVkKTtcbiAgfVxuICB0cnkge1xuICAgIGFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IGdldFJlcXVlc3QoXG4gICAgICB1cmwgfHwgUmVxdWVzdFVybC5nZXRRUlJlc3VsdCxcbiAgICAgIGlkLFxuICAgICAgYWJvcnRDb250cm9sbGVyLnNpZ25hbFxuICAgICk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgICAgcmV0dXJuIHF1ZXJ5UVJSZXN1bHQoaWQpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQuY2xpZW50UmVzcG9uc2UpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKChlcnIgYXMgRXJyb3IpLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHF1ZXJ5IFFSIHJlc3VsdFxuICovXG5leHBvcnQgY29uc3QgY2FuY2VsUXVlcnlRUlJlc3VsdCA9ICgpOiB2b2lkID0+IHtcbiAgaXNRdWVyeUNhbmNlbGVkID0gdHJ1ZTtcbiAgaWYgKGFib3J0Q29udHJvbGxlcikge1xuICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgb2JqZWN0IGZvciB0aGUgd2FsbGV0IHRvIHNpZ24uXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBzZXJ2ZXIuXG4gKiBAcGFyYW0gYWNjb3VudCAtIFNpZ25lciBkaWQuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YSA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhID0+ICh7XG4gIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgc2VydmVyOiB7XG4gICAgbmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgLi4uKGNoYWxsZW5nZS5zZXJ2ZXIuZGlkID8geyBkaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkIH0gOiB7fSksXG4gIH0sXG4gIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gIGRpZDogYWNjb3VudCxcbiAgY3JlYXRlZDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG59KTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIG9iamVjdCBmb3IgdGhlIHdhbGxldCB0byBzaWduIHVzZSBtZXRob2QgZXRoX3NpZ25UeXBlZERhdGFfdjQuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBzZXJ2ZXIuXG4gKiBAcGFyYW0gYWNjb3VudCAtIFNpZ25lciBkaWQuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YTcxMiA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhNzEyID0+ICh7XG4gIHR5cGVzOiB7XG4gICAgRUlQNzEyRG9tYWluOiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJ2ZXJzaW9uXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgIF0sXG4gICAgQ2xpZW50UmVzcG9uc2VNc2c6IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJ0eXBlXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcInNlcnZlck5hbWVcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwic2VydmVyVXJsXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcInNlcnZlckRpZFwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJub25jZVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJkaWRcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiY3JlYXRlZFwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbiAgcHJpbWFyeVR5cGU6IFwiQ2xpZW50UmVzcG9uc2VNc2dcIixcbiAgZG9tYWluOiB7XG4gICAgbmFtZTogXCJvbnRsb2dpblwiLFxuICAgIHZlcnNpb246IFwidjEuMC4wXCIsXG4gIH0sXG4gIG1lc3NhZ2U6IHtcbiAgICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gICAgc2VydmVyTmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHNlcnZlclVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgc2VydmVyRGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCxcbiAgICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICAgIGRpZDogYWNjb3VudCxcbiAgICBjcmVhdGVkOiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbIlZlcnNpb24iLCJNZXNzYWdlVHlwZSIsIkFjdGlvbiIsIkVycm9yRW51bSIsIlFyU3RhdHVzIiwiUmVxdWVzdFVybCIsIlJlcXVlc3RVcmxUZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFZQTtBQUFaLFdBQVksT0FBTztJQUNqQiwyQkFBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBRldBLGVBQU8sS0FBUEEsZUFBTyxRQUVsQjtBQUVXQztBQUFaLFdBQVksV0FBVztJQUNyQiwwQ0FBMkIsQ0FBQTtJQUMzQiwwQ0FBMkIsQ0FBQTtJQUMzQixnREFBaUMsQ0FBQTtBQUNuQyxDQUFDLEVBSldBLG1CQUFXLEtBQVhBLG1CQUFXLFFBSXRCO0FBRUQ7OztBQUdZQztBQUFaLFdBQVksTUFBTTtJQUNoQix1Q0FBVSxDQUFBO0lBQ1YseURBQW1CLENBQUE7QUFDckIsQ0FBQyxFQUhXQSxjQUFNLEtBQU5BLGNBQU0sUUFHakI7QUFFV0M7QUFBWixXQUFZLFNBQVM7SUFDbkIsb0RBQXVDLENBQUE7SUFDdkMsc0RBQXlDLENBQUE7SUFDekMsMERBQTZDLENBQUE7SUFDN0MsMkNBQThCLENBQUE7SUFDOUIsMkNBQThCLENBQUE7QUFDaEMsQ0FBQyxFQU5XQSxpQkFBUyxLQUFUQSxpQkFBUyxRQU1wQjtBQUVXQztBQUFaLFdBQVksUUFBUTtJQUNsQiw2Q0FBTyxDQUFBO0lBQ1AsNkNBQU8sQ0FBQTtJQUNQLHVDQUFJLENBQUE7QUFDTixDQUFDLEVBSldBLGdCQUFRLEtBQVJBLGdCQUFRLFFBSW5CO0FBRUQ7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
