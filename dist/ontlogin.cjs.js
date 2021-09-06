
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
exports.Error = void 0;
(function (Error) {
    Error["VersionNotSupport"] = "ERR_WRONG_VERSION";
    Error["TypeNotSupport"] = "ERR_TYPE_NOT_SUPPORTED";
    Error["ActionNotSupport"] = "ERR_ACTION_NOT_SUPPORTED";
    Error["UnknownError"] = "ERR_UNDEFINED";
})(exports.Error || (exports.Error = {}));
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
 * @param params Request body.
 * @return Promise response.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
const postRequest = async (url, body) => {
    return fetch(url, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};
/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @return Promise response.
 */
const getRequest = async (url, path) => {
    return fetch(`${url}/${path}`).then((res) => res.json());
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
 * ```typesript
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
/**
 * Query QR result from ontlogin QR server until get result or error.
 * @param id - QR id.
 * @param duration - Time duration(ms) between each request(1000 by default).
 * @return The AuthResponse for submit to server.
 */
const queryQRResult = async (id, duration = 1000) => {
    const { result, error, desc } = await getRequest(exports.RequestUrl.getQRResult, id);
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

exports.createAuthRequest = createAuthRequest;
exports.createSignData = createSignData;
exports.getRequest = getRequest;
exports.postRequest = postRequest;
exports.queryQRResult = queryQRResult;
exports.requestQR = requestQR;
exports.wait = wait;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBJZEF1dGggPSAwLFxuICBJZEF1dGhBbmRWY0F1dGggPSAxLFxufVxuXG5leHBvcnQgZW51bSBFcnJvciB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG59XG5cbmV4cG9ydCBlbnVtIFFyU3RhdHVzIHtcbiAgUGVuZGluZyxcbiAgU3VjY2VzcyxcbiAgRmFpbCxcbn1cblxuLyoqXG4gKiBPbnRsb2dpbiBRUiBzZXJ2ZXIgdXJscy5cbiAqIEBiZXRhXG4gKi9cbmV4cG9ydCBlbnVtIFJlcXVlc3RVcmwge1xuICBnZXRRUiA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvcmVzdWx0XCIsXG59XG4iLCIvKipcbiAqIFBvc3QgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIHBhcmFtcyBSZXF1ZXN0IGJvZHkuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4odXJsOiBzdHJpbmcsIGJvZHk6IGFueSk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogR2V0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBwYXRoIFJlcXVlc3QgcGF0aCBpLmUuICdpZCcgb3IgJ25ld3MvaWQnLlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaChgJHt1cmx9LyR7cGF0aH1gKS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBBc3luYyB3YWl0IHNvbWUgdGltZS5cbiAqIEBwYXJhbSB0aW1lIFNlY29uZCBhbW91bnQuXG4gKi9cbmV4cG9ydCBjb25zdCB3YWl0ID0gKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4gPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9LCB0aW1lKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHtcbiAgQXV0aENoYWxsZW5nZSxcbiAgQXV0aFJlcXVlc3QsXG4gIEF1dGhSZXNwb25zZSxcbiAgUVJSZXN1bHQsXG4gIFNpZ25EYXRhLFxufSBmcm9tIFwiLi90eXBlXCI7XG5pbXBvcnQgeyBBY3Rpb24sIE1lc3NhZ2VUeXBlLCBRclN0YXR1cywgUmVxdWVzdFVybCwgVmVyc2lvbiB9IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IGdldFJlcXVlc3QsIHBvc3RSZXF1ZXN0LCB3YWl0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3QuXG4gKiBAcGFyYW0gYWN0aW9uIC0gVGhlIGFjdGlvbiB0eXBlLlxuICogQHJldHVybiBUaGUgQXV0aFJlcXVlc3QgZm9yIGdldCBBdXRoQ2hhbGxlbmdlLlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzcmlwdFxuICogY29uc3QgYXV0aFJlcXVlc3Q6IEF1dGhSZXF1ZXN0ID0gY3JlYXRlQXV0aFJlcXVlc3QoQWN0aW9uLklkQXV0aEFuZFZjQXV0aCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKFxuICBhY3Rpb246IEFjdGlvbiA9IEFjdGlvbi5JZEF1dGhcbik6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uLFxuICB9O1xufTtcblxuLyoqXG4gKiBHZXQgUVIgd2l0aCB0aGUgQXV0aENoYWxsZW5nZSBmcm9tIG9udG9sb2dpbiBRUiBzZXJ2ZXIuXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSB5b3VyIHNlcnZlci5cbiAqIEByZXR1cm4gVGV4dCBmb3IgZ2VuZXJhdGluZyB0aGUgUVIgY29kZSBhbmQgaWQgZm9yIHF1ZXJ5IHNjYW4gcmVzdWx0LlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHsgdGV4dCwgaWQgfSA9IGF3YWl0IHJlcXVlc3RRUihjaGFsbGVuZ2UpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCByZXF1ZXN0UVIgPSBhc3luYyAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZVxuKTogUHJvbWlzZTxRUlJlc3VsdD4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IHBvc3RSZXF1ZXN0KFxuICAgIFJlcXVlc3RVcmwuZ2V0UVIsXG4gICAgY2hhbGxlbmdlXG4gICk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiByZXN1bHQuaWQsXG4gICAgdGV4dDogcmVzdWx0LnFyQ29kZSxcbiAgfTtcbn07XG5cbi8qKlxuICogUXVlcnkgUVIgcmVzdWx0IGZyb20gb250bG9naW4gUVIgc2VydmVyIHVudGlsIGdldCByZXN1bHQgb3IgZXJyb3IuXG4gKiBAcGFyYW0gaWQgLSBRUiBpZC5cbiAqIEBwYXJhbSBkdXJhdGlvbiAtIFRpbWUgZHVyYXRpb24obXMpIGJldHdlZW4gZWFjaCByZXF1ZXN0KDEwMDAgYnkgZGVmYXVsdCkuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVzcG9uc2UgZm9yIHN1Ym1pdCB0byBzZXJ2ZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVFSUmVzdWx0ID0gYXN5bmMgKFxuICBpZDogc3RyaW5nLFxuICBkdXJhdGlvbiA9IDEwMDBcbik6IFByb21pc2U8QXV0aFJlc3BvbnNlPiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgZ2V0UmVxdWVzdChSZXF1ZXN0VXJsLmdldFFSUmVzdWx0LCBpZCk7XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihkZXNjKTtcbiAgfVxuICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5QZW5kaW5nKSB7XG4gICAgYXdhaXQgd2FpdChkdXJhdGlvbik7XG4gICAgcmV0dXJuIHF1ZXJ5UVJSZXN1bHQoaWQpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZXN1bHQuY2xpZW50UmVzcG9uc2UpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyb3IpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIG9iamVjdCBmb3IgdGhlIHdhbGxldCB0byBzaWduLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gc2VydmVyLlxuICogQHBhcmFtIGFjY291bnQgLSBTaWduZXIgZGlkLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3IiLCJRclN0YXR1cyIsIlJlcXVlc3RVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVlBO0FBQVosV0FBWSxPQUFPO0lBQ2pCLDJCQUFnQixDQUFBO0FBQ2xCLENBQUMsRUFGV0EsZUFBTyxLQUFQQSxlQUFPLFFBRWxCO0FBRVdDO0FBQVosV0FBWSxXQUFXO0lBQ3JCLDBDQUEyQixDQUFBO0lBQzNCLDBDQUEyQixDQUFBO0lBQzNCLGdEQUFpQyxDQUFBO0FBQ25DLENBQUMsRUFKV0EsbUJBQVcsS0FBWEEsbUJBQVcsUUFJdEI7QUFFRDs7O0FBR1lDO0FBQVosV0FBWSxNQUFNO0lBQ2hCLHVDQUFVLENBQUE7SUFDVix5REFBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFdBLGNBQU0sS0FBTkEsY0FBTSxRQUdqQjtBQUVXQztBQUFaLFdBQVksS0FBSztJQUNmLGdEQUF1QyxDQUFBO0lBQ3ZDLGtEQUF5QyxDQUFBO0lBQ3pDLHNEQUE2QyxDQUFBO0lBQzdDLHVDQUE4QixDQUFBO0FBQ2hDLENBQUMsRUFMV0EsYUFBSyxLQUFMQSxhQUFLLFFBS2hCO0FBRVdDO0FBQVosV0FBWSxRQUFRO0lBQ2xCLDZDQUFPLENBQUE7SUFDUCw2Q0FBTyxDQUFBO0lBQ1AsdUNBQUksQ0FBQTtBQUNOLENBQUMsRUFKV0EsZ0JBQVEsS0FBUkEsZ0JBQVEsUUFJbkI7QUFFRDs7OztBQUlZQztBQUFaLFdBQVksVUFBVTtJQUNwQixvRUFBc0QsQ0FBQTtJ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
