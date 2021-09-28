
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

export { Action, ErrorEnum, MessageType, QrStatus, RequestUrl, Version, cancelQueryQRResult, createAuthRequest, createSignData, getRequest, postRequest, queryQRResult, requestQR, wait };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yRW51bSB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG4gIFVzZXJDYW5jZWxlZCA9IFwiVVNFUl9DQU5DRUxFRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbi8qKlxuICogT250bG9naW4gUVIgc2VydmVyIHVybHMuXG4gKiBAYmV0YVxuICovXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UVIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFSUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLyoqXG4gKiBQb3N0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBib2R5IFJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4oXG4gIHVybDogc3RyaW5nLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyxAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGJvZHk6IGFueSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgICBzaWduYWwsXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEdldCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGF0aCBSZXF1ZXN0IHBhdGggaS5lLiAnaWQnIG9yICduZXdzL2lkJy5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIHBhdGg6IHN0cmluZyxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCwgeyBzaWduYWwgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogQXN5bmMgd2FpdCBzb21lIHRpbWUuXG4gKiBAcGFyYW0gdGltZSBTZWNvbmQgYW1vdW50LlxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBBdXRoUmVzcG9uc2UsXG4gIFFSUmVzdWx0LFxuICBTaWduRGF0YSxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBFcnJvckVudW0sXG4gIE1lc3NhZ2VUeXBlLFxuICBRclN0YXR1cyxcbiAgUmVxdWVzdFVybCxcbiAgVmVyc2lvbixcbn0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdCwgcG9zdFJlcXVlc3QsIHdhaXQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5leHBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9O1xuXG4vKipcbiAqIENyZWF0ZSBBdXRoUmVxdWVzdC5cbiAqIEBwYXJhbSBhY3Rpb24gLSBUaGUgYWN0aW9uIHR5cGUuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVxdWVzdCBmb3IgZ2V0IEF1dGhDaGFsbGVuZ2UuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYXV0aFJlcXVlc3Q6IEF1dGhSZXF1ZXN0ID0gY3JlYXRlQXV0aFJlcXVlc3QoQWN0aW9uLklkQXV0aEFuZFZjQXV0aCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKFxuICBhY3Rpb246IEFjdGlvbiA9IEFjdGlvbi5JZEF1dGhcbik6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uLFxuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgUVIgd2l0aCB0aGUgQXV0aENoYWxsZW5nZSBmcm9tIG9udG9sb2dpbiBRUiBzZXJ2ZXIuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSB5b3VyIHNlcnZlci5cbiAqIEByZXR1cm4gVGV4dCBmb3IgZ2VuZXJhdGluZyB0aGUgUVIgY29kZSBhbmQgaWQgZm9yIHF1ZXJ5IHNjYW4gcmVzdWx0LlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHsgdGV4dCwgaWQgfSA9IGF3YWl0IHJlcXVlc3RRUihjaGFsbGVuZ2UpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCByZXF1ZXN0UVIgPSBhc3luYyAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZVxuKTogUHJvbWlzZTxRUlJlc3VsdD4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IHBvc3RSZXF1ZXN0KFxuICAgIFJlcXVlc3RVcmwuZ2V0UVIsXG4gICAgY2hhbGxlbmdlXG4gICk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiByZXN1bHQuaWQsXG4gICAgdGV4dDogcmVzdWx0LnFyQ29kZSxcbiAgfTtcbn07XG5cbmxldCBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbmxldCBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdCBmcm9tIG9udGxvZ2luIFFSIHNlcnZlciB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yLlxuICogQHBhcmFtIGlkIC0gUVIgaWQuXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uKG1zKSBiZXR3ZWVuIGVhY2ggcmVxdWVzdCgxMDAwIGJ5IGRlZmF1bHQpLlxuICogQHJldHVybiBUaGUgQXV0aFJlc3BvbnNlIGZvciBzdWJtaXQgdG8gc2VydmVyLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlRUlJlc3VsdCA9IGFzeW5jIChcbiAgaWQ6IHN0cmluZyxcbiAgZHVyYXRpb24gPSAxMDAwXG4pOiBQcm9taXNlPEF1dGhSZXNwb25zZT4gPT4ge1xuICBpZiAoaXNRdWVyeUNhbmNlbGVkKSB7XG4gICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gIH1cbiAgdHJ5IHtcbiAgICBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFxuICAgICAgUmVxdWVzdFVybC5nZXRRUlJlc3VsdCxcbiAgICAgIGlkLFxuICAgICAgYWJvcnRDb250cm9sbGVyLnNpZ25hbFxuICAgICk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgICAgcmV0dXJuIHF1ZXJ5UVJSZXN1bHQoaWQpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQuY2xpZW50UmVzcG9uc2UpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKChlcnIgYXMgRXJyb3IpLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHF1ZXJ5IFFSIHJlc3VsdFxuICovXG5leHBvcnQgY29uc3QgY2FuY2VsUXVlcnlRUlJlc3VsdCA9ICgpOiB2b2lkID0+IHtcbiAgaXNRdWVyeUNhbmNlbGVkID0gdHJ1ZTtcbiAgaWYgKGFib3J0Q29udHJvbGxlcikge1xuICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgb2JqZWN0IGZvciB0aGUgd2FsbGV0IHRvIHNpZ24uXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBzZXJ2ZXIuXG4gKiBAcGFyYW0gYWNjb3VudCAtIFNpZ25lciBkaWQuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YSA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhID0+ICh7XG4gIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgc2VydmVyOiB7XG4gICAgbmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgLi4uKGNoYWxsZW5nZS5zZXJ2ZXIuZGlkID8geyBkaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkIH0gOiB7fSksXG4gIH0sXG4gIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gIGRpZDogYWNjb3VudCxcbiAgY3JlYXRlZDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQVk7QUFBWixXQUFZLE9BQU87SUFDakIsMkJBQWdCLENBQUE7QUFDbEIsQ0FBQyxFQUZXLE9BQU8sS0FBUCxPQUFPLFFBRWxCO0lBRVc7QUFBWixXQUFZLFdBQVc7SUFDckIsMENBQTJCLENBQUE7SUFDM0IsMENBQTJCLENBQUE7SUFDM0IsZ0RBQWlDLENBQUE7QUFDbkMsQ0FBQyxFQUpXLFdBQVcsS0FBWCxXQUFXLFFBSXRCO0FBRUQ7OztJQUdZO0FBQVosV0FBWSxNQUFNO0lBQ2hCLHVDQUFVLENBQUE7SUFDVix5REFBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFcsTUFBTSxLQUFOLE1BQU0sUUFHakI7SUFFVztBQUFaLFdBQVksU0FBUztJQUNuQixvREFBdUMsQ0FBQTtJQUN2QyxzREFBeUMsQ0FBQTtJQUN6QywwREFBNkMsQ0FBQTtJQUM3QywyQ0FBOEIsQ0FBQTtJQUM5QiwyQ0FBOEIsQ0FBQTtBQUNoQyxDQUFDLEVBTlcsU0FBUyxLQUFULFNBQVMsUUFNcEI7SUFFVztBQUFaLFdBQVksUUFBUTtJQUNsQiw2Q0FBTyxDQUFBO0lBQ1AsNkNBQU8sQ0FBQTtJQUNQLHVDQUFJLENBQUE7QUFDTixDQUFDLEVBSlcsUUFBUSxLQUFSLFFBQVEsUUFJbkI7QUFFRDs7OztJQUlZ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
