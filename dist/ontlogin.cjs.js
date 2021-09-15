
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBJZEF1dGggPSAwLFxuICBJZEF1dGhBbmRWY0F1dGggPSAxLFxufVxuXG5leHBvcnQgZW51bSBFcnJvckVudW0ge1xuICBWZXJzaW9uTm90U3VwcG9ydCA9IFwiRVJSX1dST05HX1ZFUlNJT05cIixcbiAgVHlwZU5vdFN1cHBvcnQgPSBcIkVSUl9UWVBFX05PVF9TVVBQT1JURURcIixcbiAgQWN0aW9uTm90U3VwcG9ydCA9IFwiRVJSX0FDVElPTl9OT1RfU1VQUE9SVEVEXCIsXG4gIFVua25vd25FcnJvciA9IFwiRVJSX1VOREVGSU5FRFwiLFxuICBVc2VyQ2FuY2VsZWQgPSBcIlVTRVJfQ0FOQ0VMRURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG4vKipcbiAqIE9udGxvZ2luIFFSIHNlcnZlciB1cmxzLlxuICogQGJldGFcbiAqL1xuZXhwb3J0IGVudW0gUmVxdWVzdFVybCB7XG4gIGdldFFSID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL2NoYWxsZW5nZVwiLFxuICBnZXRRUlJlc3VsdCA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9yZXN1bHRcIixcbn1cbiIsIi8qKlxuICogUG9zdCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gYm9keSBSZXF1ZXN0IGJvZHkuXG4gKiBAcGFyYW0gc2lnbmFsIEFib3J0U2lnbmFsIGZvciBjYW5jZWwgcmVxdWVzdC5cbiAqIEByZXR1cm4gUHJvbWlzZSByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGNvbnN0IHBvc3RSZXF1ZXN0ID0gYXN5bmMgPFQ+KFxuICB1cmw6IHN0cmluZyxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXMsQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBib2R5OiBhbnksXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsXG4pOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogXCJwb3N0XCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgaGVhZGVyczoge1xuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH0sXG4gICAgc2lnbmFsLFxuICB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBHZXQgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIHBhdGggUmVxdWVzdCBwYXRoIGkuZS4gJ2lkJyBvciAnbmV3cy9pZCcuXG4gKiBAcGFyYW0gc2lnbmFsIEFib3J0U2lnbmFsIGZvciBjYW5jZWwgcmVxdWVzdC5cbiAqIEByZXR1cm4gUHJvbWlzZSByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGdldFJlcXVlc3QgPSBhc3luYyA8VD4oXG4gIHVybDogc3RyaW5nLFxuICBwYXRoOiBzdHJpbmcsXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsXG4pOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKGAke3VybH0vJHtwYXRofWAsIHsgc2lnbmFsIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEFzeW5jIHdhaXQgc29tZSB0aW1lLlxuICogQHBhcmFtIHRpbWUgU2Vjb25kIGFtb3VudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdhaXQgPSAodGltZTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0sIHRpbWUpO1xuICB9KTtcbn07XG4iLCJpbXBvcnQge1xuICBBdXRoQ2hhbGxlbmdlLFxuICBBdXRoUmVxdWVzdCxcbiAgQXV0aFJlc3BvbnNlLFxuICBRUlJlc3VsdCxcbiAgU2lnbkRhdGEsXG59IGZyb20gXCIuL3R5cGVcIjtcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgRXJyb3JFbnVtLFxuICBNZXNzYWdlVHlwZSxcbiAgUXJTdGF0dXMsXG4gIFJlcXVlc3RVcmwsXG4gIFZlcnNpb24sXG59IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IGdldFJlcXVlc3QsIHBvc3RSZXF1ZXN0LCB3YWl0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3QuXG4gKiBAcGFyYW0gYWN0aW9uIC0gVGhlIGFjdGlvbiB0eXBlLlxuICogQHJldHVybiBUaGUgQXV0aFJlcXVlc3QgZm9yIGdldCBBdXRoQ2hhbGxlbmdlLlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGF1dGhSZXF1ZXN0OiBBdXRoUmVxdWVzdCA9IGNyZWF0ZUF1dGhSZXF1ZXN0KEFjdGlvbi5JZEF1dGhBbmRWY0F1dGgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVBdXRoUmVxdWVzdCA9IChcbiAgYWN0aW9uOiBBY3Rpb24gPSBBY3Rpb24uSWRBdXRoXG4pOiBBdXRoUmVxdWVzdCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmVyOiBWZXJzaW9uLlZlcnNpb24xLFxuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNsaWVudEhlbGxvLFxuICAgIGFjdGlvbixcbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IFFSIHdpdGggdGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBvbnRvbG9naW4gUVIgc2VydmVyLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20geW91ciBzZXJ2ZXIuXG4gKiBAcmV0dXJuIFRleHQgZm9yIGdlbmVyYXRpbmcgdGhlIFFSIGNvZGUgYW5kIGlkIGZvciBxdWVyeSBzY2FuIHJlc3VsdC5cbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB7IHRleHQsIGlkIH0gPSBhd2FpdCByZXF1ZXN0UVIoY2hhbGxlbmdlKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdFFSID0gYXN5bmMgKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2Vcbik6IFByb21pc2U8UVJSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBwb3N0UmVxdWVzdChcbiAgICBSZXF1ZXN0VXJsLmdldFFSLFxuICAgIGNoYWxsZW5nZVxuICApO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogcmVzdWx0LmlkLFxuICAgIHRleHQ6IHJlc3VsdC5xckNvZGUsXG4gIH07XG59O1xuXG5sZXQgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG5sZXQgYWJvcnRDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHQgZnJvbSBvbnRsb2dpbiBRUiBzZXJ2ZXIgdW50aWwgZ2V0IHJlc3VsdCBvciBlcnJvci5cbiAqIEBwYXJhbSBpZCAtIFFSIGlkLlxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbihtcykgYmV0d2VlbiBlYWNoIHJlcXVlc3QoMTAwMCBieSBkZWZhdWx0KS5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXNwb25zZSBmb3Igc3VibWl0IHRvIHNlcnZlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMFxuKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+ID0+IHtcbiAgaWYgKGlzUXVlcnlDYW5jZWxlZCkge1xuICAgIGlzUXVlcnlDYW5jZWxlZCA9IGZhbHNlO1xuICAgIGFib3J0Q29udHJvbGxlciA9IG51bGw7XG4gICAgdGhyb3cgbmV3IEVycm9yKEVycm9yRW51bS5Vc2VyQ2FuY2VsZWQpO1xuICB9XG4gIHRyeSB7XG4gICAgYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgZ2V0UmVxdWVzdChcbiAgICAgIFJlcXVlc3RVcmwuZ2V0UVJSZXN1bHQsXG4gICAgICBpZCxcbiAgICAgIGFib3J0Q29udHJvbGxlci5zaWduYWxcbiAgICApO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5QZW5kaW5nKSB7XG4gICAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICAgIHJldHVybiBxdWVyeVFSUmVzdWx0KGlkKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzdWx0LmNsaWVudFJlc3BvbnNlKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICgoZXJyIGFzIEVycm9yKS5uYW1lID09PSBcIkFib3J0RXJyb3JcIikge1xuICAgICAgaXNRdWVyeUNhbmNlbGVkID0gZmFsc2U7XG4gICAgICBhYm9ydENvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9yRW51bS5Vc2VyQ2FuY2VsZWQpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8qKlxuICogU3RvcCBxdWVyeSBRUiByZXN1bHRcbiAqL1xuZXhwb3J0IGNvbnN0IGNhbmNlbFF1ZXJ5UVJSZXN1bHQgPSAoKTogdm9pZCA9PiB7XG4gIGlzUXVlcnlDYW5jZWxlZCA9IHRydWU7XG4gIGFib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBvYmplY3QgZm9yIHRoZSB3YWxsZXQgdG8gc2lnbi5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHNlcnZlci5cbiAqIEBwYXJhbSBhY2NvdW50IC0gU2lnbmVyIGRpZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVNpZ25EYXRhID0gKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2UsXG4gIGFjY291bnQ6IHN0cmluZ1xuKTogU2lnbkRhdGEgPT4gKHtcbiAgdHlwZTogXCJDbGllbnRSZXNwb25zZVwiLFxuICBzZXJ2ZXI6IHtcbiAgICBuYW1lOiBjaGFsbGVuZ2Uuc2VydmVyLm5hbWUsXG4gICAgdXJsOiBjaGFsbGVuZ2Uuc2VydmVyLnVybCxcbiAgICAuLi4oY2hhbGxlbmdlLnNlcnZlci5kaWQgPyB7IGRpZDogY2hhbGxlbmdlLnNlcnZlci5kaWQgfSA6IHt9KSxcbiAgfSxcbiAgbm9uY2U6IGNoYWxsZW5nZS5ub25jZSxcbiAgZGlkOiBhY2NvdW50LFxuICBjcmVhdGVkOiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbn0pO1xuIl0sIm5hbWVzIjpbIlZlcnNpb24iLCJNZXNzYWdlVHlwZSIsIkFjdGlvbiIsIkVycm9yRW51bSIsIlFyU3RhdHVzIiwiUmVxdWVzdFVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBWUE7QUFBWixXQUFZLE9BQU87SUFDakIsMkJBQWdCLENBQUE7QUFDbEIsQ0FBQyxFQUZXQSxlQUFPLEtBQVBBLGVBQU8sUUFFbEI7QUFFV0M7QUFBWixXQUFZLFdBQVc7SUFDckIsMENBQTJCLENBQUE7SUFDM0IsMENBQTJCLENBQUE7SUFDM0IsZ0RBQWlDLENBQUE7QUFDbkMsQ0FBQyxFQUpXQSxtQkFBVyxLQUFYQSxtQkFBVyxRQUl0QjtBQUVEOzs7QUFHWUM7QUFBWixXQUFZLE1BQU07SUFDaEIsdUNBQVUsQ0FBQTtJQUNWLHlEQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFIV0EsY0FBTSxLQUFOQSxjQUFNLFFBR2pCO0FBRVdDO0FBQVosV0FBWSxTQUFTO0lBQ25CLG9EQUF1QyxDQUFBO0lBQ3ZDLHNEQUF5QyxDQUFBO0lBQ3pDLDBEQUE2QyxDQUFBO0lBQzdDLDJDQUE4QixDQUFBO0lBQzlCLDJDQUE4QixDQUFBO0FBQ2hDLENBQUMsRUFOV0EsaUJBQVMsS0FBVEEsaUJBQVMsUUFNcEI7QUFFV0M7QUFBWixXQUFZLFFBQVE7SUFDbEIsNkNBQU8sQ0FBQTtJQUNQLDZDQUFPLENBQUE7SUFDUCx1Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUpXQSxnQkFBUSxLQUFSQSxnQkFBUSxRQUluQjtBQUVEOzs7O0FBSVlDO0FBQVosV0FBWSxVQUFVO0lBQ3BCLG9FQUFzRCxDQUFBO0lBQ3RELHVFQUF5RCxDQUFBO0FBQzNELENBQUMsRUFIV0Esa0JBQVUsS0FBVkEsa0JBQVU7O0FDcEN0Qjs7Ozs7Ozs7TUFRYSxXQUFXLEdBQUcsT0FDekIsR0FBVztBQUNYO0FBQ0EsSUFBUyxFQUNULE1BQW9CO0lBRXBCLE9BQU8sS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNoQixNQUFNLEVBQUUsTUFBTTtRQUNkLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUMxQixPQUFPLEVBQUU7WUFDUCxNQUFNLEVBQUUsa0JBQWtCO1lBQzFCLGNBQWMsRUFBRSxrQkFBa0I7U0FDbkM7UUFDRCxNQUFNO0tBQ1AsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUMvQixFQUFFO0FBRUY7Ozs7Ozs7O01BUWEsVUFBVSxHQUFHLE9BQ3hCLEdBQVcsRUFDWCxJQUFZLEVBQ1osTUFBb0I7SUFFcEIsT0FBTyxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN2RSxFQUFFO0FBRUY7Ozs7TUFJYSxJQUFJLEdBQUcsQ0FBQyxJQUFZO0lBQy9CLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPO1FBQ3pCLFVBQVUsQ0FBQztZQUNULE9BQU8sRUFBRSxDQUFDO1NBQ1gsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNWLENBQUMsQ0FBQztBQUNMOztBQzlCQTs7Ozs7Ozs7O01BU2EsaUJBQWlCLEdBQUcsQ0FDL0IsU0FBaUJILGNBQU0sQ0FBQyxNQUFNO0lBRTlCLE9BQU87UUFDTCxHQUFHLEVBQUVGLGVBQU8sQ0FBQyxRQUFRO1FBQ3JCLElBQUksRUFBRUMsbUJBQVcsQ0FBQyxXQUFXO1FBQzdCLE1BQU07S0FDUCxDQUFDO0FBQ0osRUFBRTtBQUVGOzs7Ozs7Ozs7TUFTYSxTQUFTLEdBQUcsT0FDdkIsU0FBd0I7SUFFeEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQy9DSSxrQkFBVSxDQUFDLEtBQUssRUFDaEIsU0FBUyxDQUNWLENBQUM7SUFDRixJQUFJLEtBQUssRUFBRTtRQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPO1FBQ0wsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1FBQ2IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNO0tBQ3BCLENBQUM7QUFDSixFQUFFO0FBRUYsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzVCLElBQUksZUFBZSxHQUEyQixJQUFJLENBQUM7QUFFbkQ7Ozs7OztNQU1hLGFBQWEsR0FBRyxPQUMzQixFQUFVLEVBQ1YsUUFBUSxHQUFHLElBQUk7SUFFZixJQUFJLGVBQWUsRUFBRTtRQUNuQixlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQ0YsaUJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUN6QztJQUNELElBQUk7UUFDRixlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN4QyxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLFVBQVUsQ0FDOUNFLGtCQUFVLENBQUMsV0FBVyxFQUN0QixFQUFFLEVBQ0YsZUFBZSxDQUFDLE1BQU0sQ0FDdkIsQ0FBQztRQUNGLElBQUksS0FBSyxFQUFFO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QjtRQUNELElBQUksTUFBTSxDQUFDLEtBQUssS0FBS0QsZ0JBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDckMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckIsT0FBTyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDMUI7UUFDRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUtBLGdCQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDMUM7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMvQjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osSUFBSyxHQUFhLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtZQUN4QyxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQ0QsaUJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN6QztRQUNELE1BQU0sR0FBRyxDQUFDO0tBQ1g7QUFDSCxFQUFFO0FBRUY7OztNQUdhLG1CQUFtQixHQUFHO0lBQ2pDLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDdkIsZUFBZSxFQUFFLEtBQUssRUFBRSxDQUFDO0FBQzNCLEVBQUU7QUFFRjs7Ozs7TUFLYSxjQUFjLEdBQUcsQ0FDNUIsU0FBd0IsRUFDeEIsT0FBZSxNQUNEO0lBQ2QsSUFBSSxFQUFFLGdCQUFnQjtJQUN0QixNQUFNLEVBQUU7UUFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJO1FBQzNCLEdBQUcsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUc7UUFDekIsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztLQUMvRDtJQUNELEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSztJQUN0QixHQUFHLEVBQUUsT0FBTztJQUNaLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7Q0FDdkM7Ozs7Ozs7Ozs7OyJ9
