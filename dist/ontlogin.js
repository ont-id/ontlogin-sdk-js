
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yRW51bSB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG4gIFVzZXJDYW5jZWxlZCA9IFwiVVNFUl9DQU5DRUxFRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbi8qKlxuICogT250bG9naW4gUVIgc2VydmVyIHVybHMuXG4gKiBAYmV0YVxuICovXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UVIgPSBcImh0dHBzOi8vbG9naW4ub250LmlkL3NjYW4vcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHBzOi8vbG9naW4ub250LmlkL3NjYW4vcXItY29kZS9yZXN1bHRcIixcbn1cblxuZXhwb3J0IGVudW0gUmVxdWVzdFVybFRlc3Qge1xuICBnZXRRUiA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvcmVzdWx0XCIsXG59XG4iLCIvKipcbiAqIFBvc3QgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIGJvZHkgUmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHNpZ25hbCBBYm9ydFNpZ25hbCBmb3IgY2FuY2VsIHJlcXVlc3QuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPihcbiAgdXJsOiBzdHJpbmcsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzLEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgYm9keTogYW55LFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbFxuKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaCh1cmwsIHtcbiAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9LFxuICAgIHNpZ25hbCxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogR2V0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBwYXRoIFJlcXVlc3QgcGF0aCBpLmUuICdpZCcgb3IgJ25ld3MvaWQnLlxuICogQHBhcmFtIHNpZ25hbCBBYm9ydFNpZ25hbCBmb3IgY2FuY2VsIHJlcXVlc3QuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KFxuICB1cmw6IHN0cmluZyxcbiAgcGF0aDogc3RyaW5nLFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbFxuKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaChgJHt1cmx9LyR7cGF0aH1gLCB7IHNpZ25hbCB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBBc3luYyB3YWl0IHNvbWUgdGltZS5cbiAqIEBwYXJhbSB0aW1lIFNlY29uZCBhbW91bnQuXG4gKi9cbmV4cG9ydCBjb25zdCB3YWl0ID0gKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4gPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9LCB0aW1lKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHtcbiAgQXV0aENoYWxsZW5nZSxcbiAgQXV0aFJlcXVlc3QsXG4gIEF1dGhSZXNwb25zZSxcbiAgUVJSZXN1bHQsXG4gIFNpZ25EYXRhLFxufSBmcm9tIFwiLi90eXBlXCI7XG5pbXBvcnQge1xuICBBY3Rpb24sXG4gIEVycm9yRW51bSxcbiAgTWVzc2FnZVR5cGUsXG4gIFFyU3RhdHVzLFxuICBSZXF1ZXN0VXJsLFxuICBWZXJzaW9uLFxufSBmcm9tIFwiLi9lbnVtXCI7XG5pbXBvcnQgeyBnZXRSZXF1ZXN0LCBwb3N0UmVxdWVzdCwgd2FpdCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2VudW1cIjtcbmV4cG9ydCB7IHdhaXQsIHBvc3RSZXF1ZXN0LCBnZXRSZXF1ZXN0IH07XG5cbi8qKlxuICogQ3JlYXRlIEF1dGhSZXF1ZXN0LlxuICogQHBhcmFtIGFjdGlvbiAtIFRoZSBhY3Rpb24gdHlwZS5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXF1ZXN0IGZvciBnZXQgQXV0aENoYWxsZW5nZS5cbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBhdXRoUmVxdWVzdDogQXV0aFJlcXVlc3QgPSBjcmVhdGVBdXRoUmVxdWVzdChBY3Rpb24uSWRBdXRoQW5kVmNBdXRoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoXG4gIGFjdGlvbjogQWN0aW9uID0gQWN0aW9uLklkQXV0aFxuKTogQXV0aFJlcXVlc3QgPT4ge1xuICByZXR1cm4ge1xuICAgIHZlcjogVmVyc2lvbi5WZXJzaW9uMSxcbiAgICB0eXBlOiBNZXNzYWdlVHlwZS5DbGllbnRIZWxsbyxcbiAgICBhY3Rpb24sXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIHRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gb250b2xvZ2luIFFSIHNlcnZlci5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHlvdXIgc2VydmVyLlxuICogQHBhcmFtIHVybCAtIEN1c3RvbSByZXF1ZXN0IHVybC5cbiAqIEByZXR1cm4gVGV4dCBmb3IgZ2VuZXJhdGluZyB0aGUgUVIgY29kZSBhbmQgaWQgZm9yIHF1ZXJ5IHNjYW4gcmVzdWx0LlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHsgdGV4dCwgaWQgfSA9IGF3YWl0IHJlcXVlc3RRUihjaGFsbGVuZ2UpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCByZXF1ZXN0UVIgPSBhc3luYyAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgdXJsPzogc3RyaW5nXG4pOiBQcm9taXNlPFFSUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgdXJsIHx8IFJlcXVlc3RVcmwuZ2V0UVIsXG4gICAgY2hhbGxlbmdlXG4gICk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiByZXN1bHQuaWQsXG4gICAgdGV4dDogcmVzdWx0LnFyQ29kZSxcbiAgfTtcbn07XG5cbmxldCBpc1F1ZXJ5Q2FuY2VsZWQgPSBmYWxzZTtcbmxldCBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdCBmcm9tIG9udGxvZ2luIFFSIHNlcnZlciB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yLlxuICogQHBhcmFtIGlkIC0gUVIgaWQuXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uKG1zKSBiZXR3ZWVuIGVhY2ggcmVxdWVzdCgxMDAwIGJ5IGRlZmF1bHQpLlxuICogQHBhcmFtIHVybCAtIEN1c3RvbSByZXF1ZXN0IHVybC5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXNwb25zZSBmb3Igc3VibWl0IHRvIHNlcnZlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMCxcbiAgdXJsPzogc3RyaW5nXG4pOiBQcm9taXNlPEF1dGhSZXNwb25zZT4gPT4ge1xuICBpZiAoaXNRdWVyeUNhbmNlbGVkKSB7XG4gICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JFbnVtLlVzZXJDYW5jZWxlZCk7XG4gIH1cbiAgdHJ5IHtcbiAgICBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFxuICAgICAgdXJsIHx8IFJlcXVlc3RVcmwuZ2V0UVJSZXN1bHQsXG4gICAgICBpZCxcbiAgICAgIGFib3J0Q29udHJvbGxlci5zaWduYWxcbiAgICApO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5QZW5kaW5nKSB7XG4gICAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICAgIHJldHVybiBxdWVyeVFSUmVzdWx0KGlkKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzdWx0LmNsaWVudFJlc3BvbnNlKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICgoZXJyIGFzIEVycm9yKS5uYW1lID09PSBcIkFib3J0RXJyb3JcIikge1xuICAgICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgICBhYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9yRW51bS5Vc2VyQ2FuY2VsZWQpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8qKlxuICogU3RvcCBxdWVyeSBRUiByZXN1bHRcbiAqL1xuZXhwb3J0IGNvbnN0IGNhbmNlbFF1ZXJ5UVJSZXN1bHQgPSAoKTogdm9pZCA9PiB7XG4gIGlzUXVlcnlDYW5jZWxlZCA9IHRydWU7XG4gIGlmIChhYm9ydENvbnRyb2xsZXIpIHtcbiAgICBhYm9ydENvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIG9iamVjdCBmb3IgdGhlIHdhbGxldCB0byBzaWduLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gc2VydmVyLlxuICogQHBhcmFtIGFjY291bnQgLSBTaWduZXIgZGlkLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3JFbnVtIiwiUXJTdGF0dXMiLCJSZXF1ZXN0VXJsIiwiUmVxdWVzdFVybFRlc3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBWUE7SUFBWixXQUFZLE9BQU87UUFDakIsMkJBQWdCLENBQUE7SUFDbEIsQ0FBQyxFQUZXQSxlQUFPLEtBQVBBLGVBQU8sUUFFbEI7QUFFV0M7SUFBWixXQUFZLFdBQVc7UUFDckIsMENBQTJCLENBQUE7UUFDM0IsMENBQTJCLENBQUE7UUFDM0IsZ0RBQWlDLENBQUE7SUFDbkMsQ0FBQyxFQUpXQSxtQkFBVyxLQUFYQSxt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
