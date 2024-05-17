
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

var Version;
(function (Version) {
    Version["Version1"] = "1.0";
})(Version || (Version = {}));
var MessageType;
(function (MessageType) {
    MessageType["ClientHello"] = "ClientHello";
    MessageType["ServerHello"] = "ServerHello";
    MessageType["ClientResponse"] = "ClientResponse";
})(MessageType || (MessageType = {}));
/**
 * action enums for createAuthRequest
 */
var Action;
(function (Action) {
    Action[Action["IdAuth"] = 0] = "IdAuth";
    Action[Action["IdAuthAndVcAuth"] = 1] = "IdAuthAndVcAuth";
})(Action || (Action = {}));
var ErrorEnum;
(function (ErrorEnum) {
    ErrorEnum["VersionNotSupport"] = "ERR_WRONG_VERSION";
    ErrorEnum["TypeNotSupport"] = "ERR_TYPE_NOT_SUPPORTED";
    ErrorEnum["ActionNotSupport"] = "ERR_ACTION_NOT_SUPPORTED";
    ErrorEnum["UnknownError"] = "ERR_UNDEFINED";
    ErrorEnum["UserCanceled"] = "USER_CANCELED";
})(ErrorEnum || (ErrorEnum = {}));
var QrStatus;
(function (QrStatus) {
    QrStatus[QrStatus["Pending"] = 0] = "Pending";
    QrStatus[QrStatus["Success"] = 1] = "Success";
    QrStatus[QrStatus["Fail"] = 2] = "Fail";
})(QrStatus || (QrStatus = {}));
/**
 * Ontlogin QR server urls.
 * @beta
 */
var RequestUrl;
(function (RequestUrl) {
    RequestUrl["getQR"] = "https://login.ont.id/scan/qr-code/challenge";
    RequestUrl["getQRResult"] = "https://login.ont.id/scan/qr-code/result";
})(RequestUrl || (RequestUrl = {}));
var RequestUrlTest;
(function (RequestUrlTest) {
    RequestUrlTest["getQR"] = "http://172.168.3.240:31843/qr-code/challenge";
    RequestUrlTest["getQRResult"] = "http://172.168.3.240:31843/qr-code/result";
})(RequestUrlTest || (RequestUrlTest = {}));

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
const createAuthRequest = (action = Action.IdAuth) => {
    return {
        ver: Version.Version1,
        type: MessageType.ClientHello,
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
    const { result, error, desc } = await postRequest(url || RequestUrl.getQR, challenge);
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
        throw new Error(ErrorEnum.UserCanceled);
    }
    try {
        abortController = new AbortController();
        const { result, error, desc } = await getRequest(url || RequestUrl.getQRResult, id, abortController.signal);
        if (error) {
            throw new Error(desc);
        }
        if (result.state === QrStatus.Pending) {
            await wait(duration);
            return queryQRResult(id);
        }
        if (result.state === QrStatus.Success) {
            return JSON.parse(result.clientResponse);
        }
        throw new Error(result.error);
    }
    catch (err) {
        if (err.name === "AbortError") {
            isQueryCanceled = false;
            abortController = null;
            throw new Error(ErrorEnum.UserCanceled);
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

export { Action, ErrorEnum, MessageType, QrStatus, RequestUrl, RequestUrlTest, Version, cancelQueryQRResult, createAuthRequest, createSignData, createSignData712, getRequest, postRequest, queryQRResult, requestQR, wait };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yRW51bSB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG4gIFVzZXJDYW5jZWxlZCA9IFwiVVNFUl9DQU5DRUxFRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbi8qKlxuICogT250bG9naW4gUVIgc2VydmVyIHVybHMuXG4gKiBAYmV0YVxuICovXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UVIgPSBcImh0dHBzOi8vbG9naW4ub250LmlkL3NjYW4vcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHBzOi8vbG9naW4ub250LmlkL3NjYW4vcXItY29kZS9yZXN1bHRcIixcbn1cblxuZXhwb3J0IGVudW0gUmVxdWVzdFVybFRlc3Qge1xuICBnZXRRUiA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvcmVzdWx0XCIsXG59XG4iLCIvKipcbiAqIFBvc3QgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIGJvZHkgUmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHNpZ25hbCBBYm9ydFNpZ25hbCBmb3IgY2FuY2VsIHJlcXVlc3QuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzLEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgYm9keTogYW55LFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbFxuKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaCh1cmwsIHtcbiAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9LFxuICAgIHNpZ25hbCxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogR2V0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBwYXRoIFJlcXVlc3QgcGF0aCBpLmUuICdpZCcgb3IgJ25ld3MvaWQnLlxuICogQHBhcmFtIHNpZ25hbCBBYm9ydFNpZ25hbCBmb3IgY2FuY2VsIHJlcXVlc3QuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KFxuICB1cmw6IHN0cmluZyxcbiAgcGF0aDogc3RyaW5nLFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbFxuKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaChgJHt1cmx9LyR7cGF0aH1gLCB7IHNpZ25hbCB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBBc3luYyB3YWl0IHNvbWUgdGltZS5cbiAqIEBwYXJhbSB0aW1lIFNlY29uZCBhbW91bnQuXG4gKi9cbmV4cG9ydCBjb25zdCB3YWl0ID0gKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4gPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9LCB0aW1lKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHtcbiAgQXV0aENoYWxsZW5nZSxcbiAgQXV0aFJlcXVlc3QsXG4gIEF1dGhSZXNwb25zZSxcbiAgUVJSZXN1bHQsXG4gIFNpZ25EYXRhLFxuICBTaWduRGF0YTcxMixcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBFcnJvckVudW0sXG4gIE1lc3NhZ2VUeXBlLFxuICBRclN0YXR1cyxcbiAgUmVxdWVzdFVybCxcbiAgVmVyc2lvbixcbn0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdCwgcG9zdFJlcXVlc3QsIHdhaXQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5leHBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9O1xuXG4vKipcbiAqIENyZWF0ZSBBdXRoUmVxdWVzdC5cbiAqIEBwYXJhbSBhY3Rpb24gLSBUaGUgYWN0aW9uIHR5cGUuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVxdWVzdCBmb3IgZ2V0IEF1dGhDaGFsbGVuZ2UuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYXV0aFJlcXVlc3Q6IEF1dGhSZXF1ZXN0ID0gY3JlYXRlQXV0aFJlcXVlc3QoQWN0aW9uLklkQXV0aEFuZFZjQXV0aCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKFxuICBhY3Rpb246IEFjdGlvbiA9IEFjdGlvbi5JZEF1dGhcbik6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uLFxuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgUVIgd2l0aCB0aGUgQXV0aENoYWxsZW5nZSBmcm9tIG9udG9sb2dpbiBRUiBzZXJ2ZXIuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSB5b3VyIHNlcnZlci5cbiAqIEBwYXJhbSB1cmwgLSBDdXN0b20gcmVxdWVzdCB1cmwuXG4gKiBAcmV0dXJuIFRleHQgZm9yIGdlbmVyYXRpbmcgdGhlIFFSIGNvZGUgYW5kIGlkIGZvciBxdWVyeSBzY2FuIHJlc3VsdC5cbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB7IHRleHQsIGlkIH0gPSBhd2FpdCByZXF1ZXN0UVIoY2hhbGxlbmdlKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdFFSID0gYXN5bmMgKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2UsXG4gIHVybD86IHN0cmluZ1xuKTogUHJvbWlzZTxRUlJlc3VsdD4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IHBvc3RSZXF1ZXN0KFxuICAgIHVybCB8fCBSZXF1ZXN0VXJsLmdldFFSLFxuICAgIGNoYWxsZW5nZVxuICApO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogcmVzdWx0LmlkLFxuICAgIHRleHQ6IHJlc3VsdC5xckNvZGUsXG4gIH07XG59O1xuXG5sZXQgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG5sZXQgYWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHQgZnJvbSBvbnRsb2dpbiBRUiBzZXJ2ZXIgdW50aWwgZ2V0IHJlc3VsdCBvciBlcnJvci5cbiAqIEBwYXJhbSBpZCAtIFFSIGlkLlxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbihtcykgYmV0d2VlbiBlYWNoIHJlcXVlc3QoMTAwMCBieSBkZWZhdWx0KS5cbiAqIEBwYXJhbSB1cmwgLSBDdXN0b20gcmVxdWVzdCB1cmwuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVzcG9uc2UgZm9yIHN1Ym1pdCB0byBzZXJ2ZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVFSUmVzdWx0ID0gYXN5bmMgKFxuICBpZDogc3RyaW5nLFxuICBkdXJhdGlvbiA9IDEwMDAsXG4gIHVybD86IHN0cmluZ1xuKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+ID0+IHtcbiAgaWYgKGlzUXVlcnlDYW5jZWxlZCkge1xuICAgIGlzUXVlcnlDYW5jZWxlZCA9IGZhbHNlO1xuICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgdGhyb3cgbmV3IEVycm9yKEVycm9yRW51bS5Vc2VyQ2FuY2VsZWQpO1xuICB9XG4gIHRyeSB7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgZ2V0UmVxdWVzdChcbiAgICAgIHVybCB8fCBSZXF1ZXN0VXJsLmdldFFSUmVzdWx0LFxuICAgICAgaWQsXG4gICAgICBhYm9ydENvbnRyb2xsZXIuc2lnbmFsXG4gICAgKTtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuUGVuZGluZykge1xuICAgICAgYXdhaXQgd2FpdChkdXJhdGlvbik7XG4gICAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlN1Y2Nlc3MpIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyb3IpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoKGVyciBhcyBFcnJvcikubmFtZSA9PT0gXCJBYm9ydEVycm9yXCIpIHtcbiAgICAgIGlzUXVlcnlDYW5jZWxlZCA9IGZhbHNlO1xuICAgICAgYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvckVudW0uVXNlckNhbmNlbGVkKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vKipcbiAqIFN0b3AgcXVlcnkgUVIgcmVzdWx0XG4gKi9cbmV4cG9ydCBjb25zdCBjYW5jZWxRdWVyeVFSUmVzdWx0ID0gKCk6IHZvaWQgPT4ge1xuICBpc1F1ZXJ5Q2FuY2VsZWQgPSB0cnVlO1xuICBpZiAoYWJvcnRDb250cm9sbGVyKSB7XG4gICAgYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBvYmplY3QgZm9yIHRoZSB3YWxsZXQgdG8gc2lnbi5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHNlcnZlci5cbiAqIEBwYXJhbSBhY2NvdW50IC0gU2lnbmVyIGRpZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVNpZ25EYXRhID0gKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2UsXG4gIGFjY291bnQ6IHN0cmluZ1xuKTogU2lnbkRhdGEgPT4gKHtcbiAgdHlwZTogXCJDbGllbnRSZXNwb25zZVwiLFxuICBzZXJ2ZXI6IHtcbiAgICBuYW1lOiBjaGFsbGVuZ2Uuc2VydmVyLm5hbWUsXG4gICAgdXJsOiBjaGFsbGVuZ2Uuc2VydmVyLnVybCxcbiAgICAuLi4oY2hhbGxlbmdlLnNlcnZlci5kaWQgPyB7IGRpZDogY2hhbGxlbmdlLnNlcnZlci5kaWQgfSA6IHt9KSxcbiAgfSxcbiAgbm9uY2U6IGNoYWxsZW5nZS5ub25jZSxcbiAgZGlkOiBhY2NvdW50LFxuICBjcmVhdGVkOiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbn0pO1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgb2JqZWN0IGZvciB0aGUgd2FsbGV0IHRvIHNpZ24gdXNlIG1ldGhvZCBldGhfc2lnblR5cGVkRGF0YV92NC5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHNlcnZlci5cbiAqIEBwYXJhbSBhY2NvdW50IC0gU2lnbmVyIGRpZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVNpZ25EYXRhNzEyID0gKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2UsXG4gIGFjY291bnQ6IHN0cmluZ1xuKTogU2lnbkRhdGE3MTIgPT4gKHtcbiAgdHlwZXM6IHtcbiAgICBFSVA3MTJEb21haW46IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJuYW1lXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcInZlcnNpb25cIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBDbGllbnRSZXNwb25zZU1zZzogW1xuICAgICAge1xuICAgICAgICBuYW1lOiBcInR5cGVcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwic2VydmVyTmFtZVwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJzZXJ2ZXJVcmxcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwic2VydmVyRGlkXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcIm5vbmNlXCIsXG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcImRpZFwiLFxuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJjcmVhdGVkXCIsXG4gICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuICBwcmltYXJ5VHlwZTogXCJDbGllbnRSZXNwb25zZU1zZ1wiLFxuICBkb21haW46IHtcbiAgICBuYW1lOiBcIm9udGxvZ2luXCIsXG4gICAgdmVyc2lvbjogXCJ2MS4wLjBcIixcbiAgfSxcbiAgbWVzc2FnZToge1xuICAgIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgICBzZXJ2ZXJOYW1lOiBjaGFsbGVuZ2Uuc2VydmVyLm5hbWUsXG4gICAgc2VydmVyVXJsOiBjaGFsbGVuZ2Uuc2VydmVyLnVybCxcbiAgICBzZXJ2ZXJEaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkLFxuICAgIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gICAgZGlkOiBhY2NvdW50LFxuICAgIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFZO0FBQVosV0FBWSxPQUFPO0lBQ2pCLDJCQUFnQixDQUFBO0FBQ2xCLENBQUMsRUFGVyxPQUFPLEtBQVAsT0FBTyxRQUVsQjtJQUVXO0FBQVosV0FBWSxXQUFXO0lBQ3JCLDBDQUEyQixDQUFBO0lBQzNCLDBDQUEyQixDQUFBO0lBQzNCLGdEQUFpQyxDQUFBO0FBQ25DLENBQUMsRUFKVyxXQUFXLEtBQVgsV0FBVyxRQUl0QjtBQUVEOzs7SUFHWTtBQUFaLFdBQVksTUFBTTtJQUNoQix1Q0FBVSxDQUFBO0lBQ1YseURBQW1CLENBQUE7QUFDckIsQ0FBQyxFQUhXLE1BQU0sS0FBTixNQUFNLFFBR2pCO0lBRVc7QUFBWixXQUFZLFNBQVM7SUFDbkIsb0RBQXVDLENBQUE7SUFDdkMsc0RBQXlDLENBQUE7SUFDekMsMERBQTZDLENBQUE7SUFDN0MsMkNBQThCLENBQUE7SUFDOUIsMkNBQThCLENBQUE7QUFDaEMsQ0FBQyxFQU5XLFNBQVMsS0FBVCxTQUFTLFFBTXBCO0lBRVc7QUFBWixXQUFZLFFBQVE7SUFDbEIsNkNBQU8sQ0FBQTtJQUNQLDZDQUFPLENBQUE7SUFDUCx1Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUpXLFFBQVEsS0FBUixRQUFRLFFBSW5CO0FBRUQ7Ozs7SUFJWTtBQUFaLFdBQVksVUFBVTtJQUNwQixtRUFBcUQsQ0FBQTtJQUNyRCxzRUFBd0QsQ0FBQTtBQUMxRCxDQUFDLEVBSFcsVUFBVSxLQUFWLFVBQVUsUUFHckI7SUFFVztBQUFaLFdBQVks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
