
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
 * @param body Request body.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBJZEF1dGggPSAwLFxuICBJZEF1dGhBbmRWY0F1dGggPSAxLFxufVxuXG5leHBvcnQgZW51bSBFcnJvciB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG59XG5cbmV4cG9ydCBlbnVtIFFyU3RhdHVzIHtcbiAgUGVuZGluZyxcbiAgU3VjY2VzcyxcbiAgRmFpbCxcbn1cblxuLyoqXG4gKiBPbnRsb2dpbiBRUiBzZXJ2ZXIgdXJscy5cbiAqIEBiZXRhXG4gKi9cbmV4cG9ydCBlbnVtIFJlcXVlc3RVcmwge1xuICBnZXRRUiA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UVJSZXN1bHQgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvcmVzdWx0XCIsXG59XG4iLCIvKipcbiAqIFBvc3QgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIGJvZHkgUmVxdWVzdCBib2R5LlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcywgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNvbnN0IHBvc3RSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBib2R5OiBhbnkpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogXCJwb3N0XCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gICAgaGVhZGVyczoge1xuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH0sXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEdldCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGF0aCBSZXF1ZXN0IHBhdGggaS5lLiAnaWQnIG9yICduZXdzL2lkJy5cbiAqIEByZXR1cm4gUHJvbWlzZSByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGdldFJlcXVlc3QgPSBhc3luYyA8VD4odXJsOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogQXN5bmMgd2FpdCBzb21lIHRpbWUuXG4gKiBAcGFyYW0gdGltZSBTZWNvbmQgYW1vdW50LlxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBBdXRoUmVzcG9uc2UsXG4gIFFSUmVzdWx0LFxuICBTaWduRGF0YSxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHsgQWN0aW9uLCBNZXNzYWdlVHlwZSwgUXJTdGF0dXMsIFJlcXVlc3RVcmwsIFZlcnNpb24gfSBmcm9tIFwiLi9lbnVtXCI7XG5pbXBvcnQgeyBnZXRSZXF1ZXN0LCBwb3N0UmVxdWVzdCwgd2FpdCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2VudW1cIjtcbmV4cG9ydCB7IHdhaXQsIHBvc3RSZXF1ZXN0LCBnZXRSZXF1ZXN0IH07XG5cbi8qKlxuICogQ3JlYXRlIEF1dGhSZXF1ZXN0LlxuICogQHBhcmFtIGFjdGlvbiAtIFRoZSBhY3Rpb24gdHlwZS5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXF1ZXN0IGZvciBnZXQgQXV0aENoYWxsZW5nZS5cbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBhdXRoUmVxdWVzdDogQXV0aFJlcXVlc3QgPSBjcmVhdGVBdXRoUmVxdWVzdChBY3Rpb24uSWRBdXRoQW5kVmNBdXRoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoXG4gIGFjdGlvbjogQWN0aW9uID0gQWN0aW9uLklkQXV0aFxuKTogQXV0aFJlcXVlc3QgPT4ge1xuICByZXR1cm4ge1xuICAgIHZlcjogVmVyc2lvbi5WZXJzaW9uMSxcbiAgICB0eXBlOiBNZXNzYWdlVHlwZS5DbGllbnRIZWxsbyxcbiAgICBhY3Rpb24sXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIHRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gb250b2xvZ2luIFFSIHNlcnZlci5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHlvdXIgc2VydmVyLlxuICogQHJldHVybiBUZXh0IGZvciBnZW5lcmF0aW5nIHRoZSBRUiBjb2RlIGFuZCBpZCBmb3IgcXVlcnkgc2NhbiByZXN1bHQuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgeyB0ZXh0LCBpZCB9ID0gYXdhaXQgcmVxdWVzdFFSKGNoYWxsZW5nZSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlXG4pOiBQcm9taXNlPFFSUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgUmVxdWVzdFVybC5nZXRRUixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHQgZnJvbSBvbnRsb2dpbiBRUiBzZXJ2ZXIgdW50aWwgZ2V0IHJlc3VsdCBvciBlcnJvci5cbiAqIEBwYXJhbSBpZCAtIFFSIGlkLlxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbihtcykgYmV0d2VlbiBlYWNoIHJlcXVlc3QoMTAwMCBieSBkZWZhdWx0KS5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXNwb25zZSBmb3Igc3VibWl0IHRvIHNlcnZlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMFxuKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFJlcXVlc3RVcmwuZ2V0UVJSZXN1bHQsIGlkKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgb2JqZWN0IGZvciB0aGUgd2FsbGV0IHRvIHNpZ24uXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBzZXJ2ZXIuXG4gKiBAcGFyYW0gYWNjb3VudCAtIFNpZ25lciBkaWQuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YSA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhID0+ICh7XG4gIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgc2VydmVyOiB7XG4gICAgbmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgLi4uKGNoYWxsZW5nZS5zZXJ2ZXIuZGlkID8geyBkaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkIH0gOiB7fSksXG4gIH0sXG4gIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gIGRpZDogYWNjb3VudCxcbiAgY3JlYXRlZDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG59KTtcbiJdLCJuYW1lcyI6WyJWZXJzaW9uIiwiTWVzc2FnZVR5cGUiLCJBY3Rpb24iLCJFcnJvciIsIlFyU3RhdHVzIiwiUmVxdWVzdFVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBWUE7QUFBWixXQUFZLE9BQU87SUFDakIsMkJBQWdCLENBQUE7QUFDbEIsQ0FBQyxFQUZXQSxlQUFPLEtBQVBBLGVBQU8sUUFFbEI7QUFFV0M7QUFBWixXQUFZLFdBQVc7SUFDckIsMENBQTJCLENBQUE7SUFDM0IsMENBQTJCLENBQUE7SUFDM0IsZ0RBQWlDLENBQUE7QUFDbkMsQ0FBQyxFQUpXQSxtQkFBVyxLQUFYQSxtQkFBVyxRQUl0QjtBQUVEOzs7QUFHWUM7QUFBWixXQUFZLE1BQU07SUFDaEIsdUNBQVUsQ0FBQTtJQUNWLHlEQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFIV0EsY0FBTSxLQUFOQSxjQUFNLFFBR2pCO0FBRVdDO0FBQVosV0FBWSxLQUFLO0lBQ2YsZ0RBQXVDLENBQUE7SUFDdkMsa0RBQXlDLENBQUE7SUFDekMsc0RBQTZDLENBQUE7SUFDN0MsdUNBQThCLENBQUE7QUFDaEMsQ0FBQyxFQUxXQSxhQUFLLEtBQUxBLGFBQUssUUFLaEI7QUFFV0M7QUFBWixXQUFZLFFBQVE7SUFDbEIsNkNBQU8sQ0FBQTtJQUNQLDZDQUFPLENBQUE7SUFDUCx1Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUpXQSxnQkFBUSxLQUFSQSxnQkFBUSxRQUluQjtBQUVEOzs7O0FBSVlDO0FBQVosV0FBWSxVQUFVO0lBQ3BCLG9FQUFzRCxDQUFBO0lB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
