
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

var ontlogin = (function (exports) {
    'use strict';

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
        RequestUrl["getQR"] = "http://172.168.3.240:31843/qr-code/challenge";
        RequestUrl["getQRResult"] = "http://172.168.3.240:31843/qr-code/result";
    })(exports.RequestUrl || (exports.RequestUrl = {}));

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
     * @return Text for generating the QR code and id for query scan result.
     * @example
     * ```typescript
     * const { text, id } = await requestQR(challenge);
     * ```
     */
    const requestQR = async (challenge) => {
        const { result, error, desc } = await postRequest(exports.RequestUrl.getQR, challenge);
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
            throw new Error(exports.ErrorEnum.UserCanceled);
        }
        try {
            abortController = new AbortController();
            const { result, error, desc } = await getRequest(exports.RequestUrl.getQRResult, id, abortController.signal);
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

    exports.cancelQueryQRResult = cancelQueryQRResult;
    exports.createAuthRequest = createAuthRequest;
    exports.createSignData = createSignData;
    exports.getRequest = getRequest;
    exports.postRequest = postRequest;
    exports.queryQRResult = queryQRResult;
    exports.requestQR = requestQR;
    exports.wait = wait;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yRW51bSB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG4gIFVzZXJDYW5jZWxlZCA9IFwiVVNFUl9DQU5DRUxFRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbi8qKlxuICogT250bG9naW4gUVIgc2VydmVyIHVybHMuXG4gKiBAYmV0YVxuICovXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UVIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFSUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLyoqXG4gKiBQb3N0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBib2R5IFJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4oXG4gIHVybDogc3RyaW5nLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyxAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGJvZHk6IGFueSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgICBzaWduYWwsXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEdldCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGF0aCBSZXF1ZXN0IHBhdGggaS5lLiAnaWQnIG9yICduZXdzL2lkJy5cbiAqIEBwYXJhbSBzaWduYWwgQWJvcnRTaWduYWwgZm9yIGNhbmNlbCByZXF1ZXN0LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIHBhdGg6IHN0cmluZyxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWxcbik6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCwgeyBzaWduYWwgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogQXN5bmMgd2FpdCBzb21lIHRpbWUuXG4gKiBAcGFyYW0gdGltZSBTZWNvbmQgYW1vdW50LlxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBBdXRoUmVzcG9uc2UsXG4gIFFSUmVzdWx0LFxuICBTaWduRGF0YSxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBFcnJvckVudW0sXG4gIE1lc3NhZ2VUeXBlLFxuICBRclN0YXR1cyxcbiAgUmVxdWVzdFVybCxcbiAgVmVyc2lvbixcbn0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdCwgcG9zdFJlcXVlc3QsIHdhaXQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5leHBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9O1xuXG4vKipcbiAqIENyZWF0ZSBBdXRoUmVxdWVzdC5cbiAqIEBwYXJhbSBhY3Rpb24gLSBUaGUgYWN0aW9uIHR5cGUuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVxdWVzdCBmb3IgZ2V0IEF1dGhDaGFsbGVuZ2UuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYXV0aFJlcXVlc3Q6IEF1dGhSZXF1ZXN0ID0gY3JlYXRlQXV0aFJlcXVlc3QoQWN0aW9uLklkQXV0aEFuZFZjQXV0aCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKFxuICBhY3Rpb246IEFjdGlvbiA9IEFjdGlvbi5JZEF1dGhcbik6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uLFxuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgUVIgd2l0aCB0aGUgQXV0aENoYWxsZW5nZSBmcm9tIG9udG9sb2dpbiBRUiBzZXJ2ZXIuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSB5b3VyIHNlcnZlci5cbiAqIEByZXR1cm4gVGV4dCBmb3IgZ2VuZXJhdGluZyB0aGUgUVIgY29kZSBhbmQgaWQgZm9yIHF1ZXJ5IHNjYW4gcmVzdWx0LlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHsgdGV4dCwgaWQgfSA9IGF3YWl0IHJlcXVlc3RRUihjaGFsbGVuZ2UpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCByZXF1ZXN0UVIgPSBhc3luYyAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZVxuKTogUHJvbWlzZTxRUlJlc3VsdD4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IHBvc3RSZXF1ZXN0KFxuICAgIFJlcXVlc3RVcmwuZ2V0UVIsXG4gICAgY2hhbGxlbmdlXG4gICk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiByZXN1bHQuaWQsXG4gICAgdGV4dDogcmVzdWx0LnFyQ29kZSxcbiAgfTtcbn07XG5cbmxldCBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbmxldCBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdCBmcm9tIG9udGxvZ2luIFFSIHNlcnZlciB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yLlxuICogQHBhcmFtIGlkIC0gUVIgaWQuXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uKG1zKSBiZXR3ZWVuIGVhY2ggcmVxdWVzdCgxMDAwIGJ5IGRlZmF1bHQpLlxuICogQHJldHVybiBUaGUgQXV0aFJlc3BvbnNlIGZvciBzdWJtaXQgdG8gc2VydmVyLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlRUlJlc3VsdCA9IGFzeW5jIChcbiAgaWQ6IHN0cmluZyxcbiAgZHVyYXRpb24gPSAxMDAwXG4pOiBQcm9taXNlPEF1dGhSZXNwb25zZT4gPT4ge1xuICBpZiAoaXNRdWVyeUNhbmNlbGVkKSB7XG4gICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gIH1cbiAgdHJ5IHtcbiAgICBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFxuICAgICAgUmVxdWVzdFVybC5nZXRRUlJlc3VsdCxcbiAgICAgIGlkLFxuICAgICAgYWJvcnRDb250cm9sbGVyLnNpZ25hbFxuICAgICk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgICAgcmV0dXJuIHF1ZXJ5UVJSZXN1bHQoaWQpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQuY2xpZW50UmVzcG9uc2UpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKChlcnIgYXMgRXJyb3IpLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHF1ZXJ5IFFSIHJlc3VsdFxuICovXG5leHBvcnQgY29uc3QgY2FuY2VsUXVlcnlRUlJlc3VsdCA9ICgpOiB2b2lkID0+IHtcbiAgaXNRdWVyeUNhbmNlbGVkID0gdHJ1ZTtcbiAgYWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIG9iamVjdCBmb3IgdGhlIHdhbGxldCB0byBzaWduLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gc2VydmVyLlxuICogQHBhcmFtIGFjY291bnQgLSBTaWduZXIgZGlkLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3JFbnVtIiwiUXJTdGF0dXMiLCJSZXF1ZXN0VXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVlBO0lBQVosV0FBWSxPQUFPO1FBQ2pCLDJCQUFnQixDQUFBO0lBQ2xCLENBQUMsRUFGV0EsZUFBTyxLQUFQQSxlQUFPLFFBRWxCO0FBRVdDO0lBQVosV0FBWSxXQUFXO1FBQ3JCLDBDQUEyQixDQUFBO1FBQzNCLDBDQUEyQixDQUFBO1FBQzNCLGdEQUFpQyxDQUFBO0lBQ25DLENBQUMsRUFKV0EsbUJBQVcsS0FBWEEsbUJBQVcsUUFJdEI7SUFFRDs7O0FBR1lDO0lBQVosV0FBWSxNQUFNO1FBQ2hCLHVDQUFVLENBQUE7UUFDVix5REFBbUIsQ0FBQTtJQUNyQixDQUFDLEVBSFdBLGNBQU0sS0FBTkEsY0FBTSxRQUdqQjtBQUVXQztJQUFaLFdBQVksU0FBUztRQUNuQixvREFBdUMsQ0FBQTtRQUN2QyxzREFBeUMsQ0FBQTtRQUN6QywwREFBNkMsQ0FBQTtRQUM3QywyQ0FBOEIsQ0FBQTtRQUM5QiwyQ0FBOEIsQ0FBQTtJQUNoQyxDQUFDLEVBTldBLGlCQUFTLEtBQVRBLGlCQUFTLFFBTXBCO0FBRVdDO0lBQVosV0FBWSxRQUFRO1FBQ2xCLDZDQUFPLENBQUE7UUFDUCw2Q0FBTyxDQUFBO1FBQ1AsdUNBQUks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
