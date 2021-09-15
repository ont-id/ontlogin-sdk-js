
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
    RequestUrl["getQR"] = "http://172.168.3.240:31843/qr-code/challenge";
    RequestUrl["getQRResult"] = "http://172.168.3.240:31843/qr-code/result";
})(RequestUrl || (RequestUrl = {}));

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
 * @return Text for generating the QR code and id for query scan result.
 * @example
 * ```typescript
 * const { text, id } = await requestQR(challenge);
 * ```
 */
const requestQR = async (challenge) => {
    const { result, error, desc } = await postRequest(RequestUrl.getQR, challenge);
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
 * @return The AuthResponse for submit to server.
 */
const queryQRResult = async (id, duration = 1000) => {
    if (isQueryCanceled) {
        isQueryCanceled = false;
        abortController = null;
        throw new Error(ErrorEnum.UserCanceled);
    }
    try {
        abortController = new AbortController();
        const { result, error, desc } = await getRequest(RequestUrl.getQRResult, id, abortController.signal);
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
    abortController?.abort();
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

export { Action, ErrorEnum, MessageType, QrStatus, RequestUrl, Version, cancelQueryQRResult, createAuthRequest, createSignData, getRequest, postRequest, queryQRResult, requestQR, wait };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yRW51bSB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG4gIFVzZXJDYW5jZWxlZCA9IFwiVVNFUl9DQU5DRUxFRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbi8qKlxuICogT250bG9naW4gUVIgc2VydmVyIHVybHMuXG4gKiBAYmV0YVxuICovXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UVIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFSUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLyoqXG4gKiBQb3N0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBib2R5IFJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4oXG4gIHVybDogc3RyaW5nLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyxAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGJvZHk6IGFueSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgICBzaWduYWwsXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEdldCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGF0aCBSZXF1ZXN0IHBhdGggaS5lLiAnaWQnIG9yICduZXdzL2lkJy5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIHBhdGg6IHN0cmluZyxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCwgeyBzaWduYWwgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogQXN5bmMgd2FpdCBzb21lIHRpbWUuXG4gKiBAcGFyYW0gdGltZSBTZWNvbmQgYW1vdW50LlxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBBdXRoUmVzcG9uc2UsXG4gIFFSUmVzdWx0LFxuICBTaWduRGF0YSxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBFcnJvckVudW0sXG4gIE1lc3NhZ2VUeXBlLFxuICBRclN0YXR1cyxcbiAgUmVxdWVzdFVybCxcbiAgVmVyc2lvbixcbn0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdCwgcG9zdFJlcXVlc3QsIHdhaXQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5leHBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9O1xuXG4vKipcbiAqIENyZWF0ZSBBdXRoUmVxdWVzdC5cbiAqIEBwYXJhbSBhY3Rpb24gLSBUaGUgYWN0aW9uIHR5cGUuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVxdWVzdCBmb3IgZ2V0IEF1dGhDaGFsbGVuZ2UuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYXV0aFJlcXVlc3Q6IEF1dGhSZXF1ZXN0ID0gY3JlYXRlQXV0aFJlcXVlc3QoQWN0aW9uLklkQXV0aEFuZFZjQXV0aCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKFxuICBhY3Rpb246IEFjdGlvbiA9IEFjdGlvbi5JZEF1dGhcbik6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uLFxuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgUVIgd2l0aCB0aGUgQXV0aENoYWxsZW5nZSBmcm9tIG9udG9sb2dpbiBRUiBzZXJ2ZXIuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSB5b3VyIHNlcnZlci5cbiAqIEByZXR1cm4gVGV4dCBmb3IgZ2VuZXJhdGluZyB0aGUgUVIgY29kZSBhbmQgaWQgZm9yIHF1ZXJ5IHNjYW4gcmVzdWx0LlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHsgdGV4dCwgaWQgfSA9IGF3YWl0IHJlcXVlc3RRUihjaGFsbGVuZ2UpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCByZXF1ZXN0UVIgPSBhc3luYyAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZVxuKTogUHJvbWlzZTxRUlJlc3VsdD4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IHBvc3RSZXF1ZXN0KFxuICAgIFJlcXVlc3RVcmwuZ2V0UVIsXG4gICAgY2hhbGxlbmdlXG4gICk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiByZXN1bHQuaWQsXG4gICAgdGV4dDogcmVzdWx0LnFyQ29kZSxcbiAgfTtcbn07XG5cbmxldCBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbmxldCBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdCBmcm9tIG9udGxvZ2luIFFSIHNlcnZlciB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yLlxuICogQHBhcmFtIGlkIC0gUVIgaWQuXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uKG1zKSBiZXR3ZWVuIGVhY2ggcmVxdWVzdCgxMDAwIGJ5IGRlZmF1bHQpLlxuICogQHJldHVybiBUaGUgQXV0aFJlc3BvbnNlIGZvciBzdWJtaXQgdG8gc2VydmVyLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlRUlJlc3VsdCA9IGFzeW5jIChcbiAgaWQ6IHN0cmluZyxcbiAgZHVyYXRpb24gPSAxMDAwXG4pOiBQcm9taXNlPEF1dGhSZXNwb25zZT4gPT4ge1xuICBpZiAoaXNRdWVyeUNhbmNlbGVkKSB7XG4gICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gIH1cbiAgdHJ5IHtcbiAgICBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFxuICAgICAgUmVxdWVzdFVybC5nZXRRUlJlc3VsdCxcbiAgICAgIGlkLFxuICAgICAgYWJvcnRDb250cm9sbGVyLnNpZ25hbFxuICAgICk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgICAgcmV0dXJuIHF1ZXJ5UVJSZXN1bHQoaWQpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQuY2xpZW50UmVzcG9uc2UpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKChlcnIgYXMgRXJyb3IpLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHF1ZXJ5IFFSIHJlc3VsdFxuICovXG5leHBvcnQgY29uc3QgY2FuY2VsUXVlcnlRUlJlc3VsdCA9ICgpOiB2b2lkID0+IHtcbiAgaXNRdWVyeUNhbmNlbGVkID0gdHJ1ZTtcbiAgYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIG9iamVjdCBmb3IgdGhlIHdhbGxldCB0byBzaWduLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gc2VydmVyLlxuICogQHBhcmFtIGFjY291bnQgLSBTaWduZXIgZGlkLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFZO0FBQVosV0FBWSxPQUFPO0lBQ2pCLDJCQUFnQixDQUFBO0FBQ2xCLENBQUMsRUFGVyxPQUFPLEtBQVAsT0FBTyxRQUVsQjtJQUVXO0FBQVosV0FBWSxXQUFXO0lBQ3JCLDBDQUEyQixDQUFBO0lBQzNCLDBDQUEyQixDQUFBO0lBQzNCLGdEQUFpQyxDQUFBO0FBQ25DLENBQUMsRUFKVyxXQUFXLEtBQVgsV0FBVyxRQUl0QjtBQUVEOzs7SUFHWTtBQUFaLFdBQVksTUFBTTtJQUNoQix1Q0FBVSxDQUFBO0lBQ1YseURBQW1CLENBQUE7QUFDckIsQ0FBQyxFQUhXLE1BQU0sS0FBTixNQUFNLFFBR2pCO0lBRVc7QUFBWixXQUFZLFNBQVM7SUFDbkIsb0RBQXVDLENBQUE7SUFDdkMsc0RBQXlDLENBQUE7SUFDekMsMERBQTZDLENBQUE7SUFDN0MsMkNBQThCLENBQUE7SUFDOUIsMkNBQThCLENBQUE7QUFDaEMsQ0FBQyxFQU5XLFNBQVMsS0FBVCxTQUFTLFFBTXBCO0lBRVc7QUFBWixXQUFZLFFBQVE7SUFDbEIsNkNBQU8sQ0FBQTtJQUNQLDZDQUFPLENBQUE7SUFDUCx1Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUpXLFFBQVEsS0FBUixRQUFRLFFBSW5CO0FBRUQ7Ozs7SUFJWTtBQUFaLFdBQVksVUFBVTtJQUNwQixvRUFBc0QsQ0FB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
