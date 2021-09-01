
  /**
   * @license
   * author: yuanzeyu@onchain.com
   * ontlogin.js v0.0.5
   * Released under the ISC license.
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
exports.RequestUrl = void 0;
(function (RequestUrl) {
    RequestUrl["getQr"] = "http://172.168.3.240:31843/qr-code/challenge";
    RequestUrl["getQrResult"] = "http://172.168.3.240:31843/qr-code/result";
})(exports.RequestUrl || (exports.RequestUrl = {}));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
const postRequest = async (url, params) => {
    return fetch(url, {
        method: "post",
        body: JSON.stringify(params),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};
const getRequest = async (url, path) => {
    return fetch(`${url}/${path}`).then((res) => res.json());
};
const wait = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

/**
 * Create AuthRequest
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#send-authentication-request
 * @param action - Action 0-IdAuth 1-IdAuth and VcAuth
 * @returns AuthRequest
 * @beta
 */
const createAuthRequest = (action) => {
    return {
        ver: exports.Version.Version1,
        type: exports.MessageType.ClientHello,
        action,
    };
};
/**
 * Get QR with AuthChallenge
 * @param challenge - AuthChallenge
 * @returns QR Text and QR id
 * @beta
 */
const requestQR = async (challenge) => {
    const { result, error, desc } = await postRequest(exports.RequestUrl.getQr, challenge);
    if (error) {
        throw new Error(desc);
    }
    return {
        id: result.id,
        text: result.qrCode,
    };
};
/**
 * Query QR result
 * @desc Fetch QR result until get result or error
 * @param id - QR id
 * @param duration - Time duration between each request
 * @returns ChallengeResponse, refer to doc-url-to-ChallengeResponse
 * @beta
 */
const queryQRResult = async (id, duration = 1000) => {
    const { result, error, desc } = await getRequest(exports.RequestUrl.getQrResult, id);
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
 * create signData
 * @param challenge - AuthChallenge
 * @param account - signer did
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBJZEF1dGggPSAwLFxuICBJZEF1dGhBbmRWY0F1dGggPSAxLFxufVxuXG5leHBvcnQgZW51bSBFcnJvciB7XG4gIFZlcnNpb25Ob3RTdXBwb3J0ID0gXCJFUlJfV1JPTkdfVkVSU0lPTlwiLFxuICBUeXBlTm90U3VwcG9ydCA9IFwiRVJSX1RZUEVfTk9UX1NVUFBPUlRFRFwiLFxuICBBY3Rpb25Ob3RTdXBwb3J0ID0gXCJFUlJfQUNUSU9OX05PVF9TVVBQT1JURURcIixcbiAgVW5rbm93bkVycm9yID0gXCJFUlJfVU5ERUZJTkVEXCIsXG59XG5cbmV4cG9ydCBlbnVtIFFyU3RhdHVzIHtcbiAgUGVuZGluZyxcbiAgU3VjY2VzcyxcbiAgRmFpbCxcbn1cblxuZXhwb3J0IGVudW0gUmVxdWVzdFVybCB7XG4gIGdldFFyID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL2NoYWxsZW5nZVwiLFxuICBnZXRRclJlc3VsdCA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9yZXN1bHRcIixcbn1cbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4odXJsOiBzdHJpbmcsIHBhcmFtczogYW55KTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaCh1cmwsIHtcbiAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksXG4gICAgaGVhZGVyczoge1xuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH0sXG4gIH0pLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaChgJHt1cmx9LyR7cGF0aH1gKS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuZXhwb3J0IGNvbnN0IHdhaXQgPSAodGltZTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0sIHRpbWUpO1xuICB9KTtcbn07XG4iLCJpbXBvcnQge1xuICBBdXRoQ2hhbGxlbmdlLFxuICBBdXRoUmVxdWVzdCxcbiAgQ2hhbGxlbmdlUmVzcG9uc2UsXG4gIFFyUmVzdWx0LFxuICBTaWduRGF0YSxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHsgQWN0aW9uLCBNZXNzYWdlVHlwZSwgUXJTdGF0dXMsIFJlcXVlc3RVcmwsIFZlcnNpb24gfSBmcm9tIFwiLi9lbnVtXCI7XG5pbXBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2VudW1cIjtcbmV4cG9ydCB7IHdhaXQsIHBvc3RSZXF1ZXN0LCBnZXRSZXF1ZXN0IH07XG5cbi8qKlxuICogQ3JlYXRlIEF1dGhSZXF1ZXN0XG4gKiBAZGVzYyBSZWZlciB0byBodHRwczovL29udG9sb2d5LTEuZ2l0Ym9vay5pby9vbnQtbG9naW4vdHV0b3JpYWxzL2dldC1zdGFydGVkI3NlbmQtYXV0aGVudGljYXRpb24tcmVxdWVzdFxuICogQHBhcmFtIGFjdGlvbiAtIEFjdGlvbiAwLUlkQXV0aCAxLUlkQXV0aCBhbmQgVmNBdXRoXG4gKiBAcmV0dXJucyBBdXRoUmVxdWVzdFxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKGFjdGlvbjogQWN0aW9uKTogQXV0aFJlcXVlc3QgPT4ge1xuICByZXR1cm4ge1xuICAgIHZlcjogVmVyc2lvbi5WZXJzaW9uMSxcbiAgICB0eXBlOiBNZXNzYWdlVHlwZS5DbGllbnRIZWxsbyxcbiAgICBhY3Rpb24sXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIEF1dGhDaGFsbGVuZ2VcbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBBdXRoQ2hhbGxlbmdlXG4gKiBAcmV0dXJucyBRUiBUZXh0IGFuZCBRUiBpZFxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlXG4pOiBQcm9taXNlPFFyUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgUmVxdWVzdFVybC5nZXRRcixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHRcbiAqIEBkZXNjIEZldGNoIFFSIHJlc3VsdCB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yXG4gKiBAcGFyYW0gaWQgLSBRUiBpZFxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbiBiZXR3ZWVuIGVhY2ggcmVxdWVzdFxuICogQHJldHVybnMgQ2hhbGxlbmdlUmVzcG9uc2UsIHJlZmVyIHRvIGRvYy11cmwtdG8tQ2hhbGxlbmdlUmVzcG9uc2VcbiAqIEBiZXRhXG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVFSUmVzdWx0ID0gYXN5bmMgKFxuICBpZDogc3RyaW5nLFxuICBkdXJhdGlvbiA9IDEwMDBcbik6IFByb21pc2U8Q2hhbGxlbmdlUmVzcG9uc2U+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFJlcXVlc3RVcmwuZ2V0UXJSZXN1bHQsIGlkKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG59O1xuXG4vKipcbiAqIGNyZWF0ZSBzaWduRGF0YVxuICogQHBhcmFtIGNoYWxsZW5nZSAtIEF1dGhDaGFsbGVuZ2VcbiAqIEBwYXJhbSBhY2NvdW50IC0gc2lnbmVyIGRpZFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3IiLCJRclN0YXR1cyIsIlJlcXVlc3RVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFZQTtBQUFaLFdBQVksT0FBTztJQUNqQiwyQkFBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBRldBLGVBQU8sS0FBUEEsZUFBTyxRQUVsQjtBQUVXQztBQUFaLFdBQVksV0FBVztJQUNyQiwwQ0FBMkIsQ0FBQTtJQUMzQiwwQ0FBMkIsQ0FBQTtJQUMzQixnREFBaUMsQ0FBQTtBQUNuQyxDQUFDLEVBSldBLG1CQUFXLEtBQVhBLG1CQUFXLFFBSXRCO0FBRUQ7OztBQUdZQztBQUFaLFdBQVksTUFBTTtJQUNoQix1Q0FBVSxDQUFBO0lBQ1YseURBQW1CLENBQUE7QUFDckIsQ0FBQyxFQUhXQSxjQUFNLEtBQU5BLGNBQU0sUUFHakI7QUFFV0M7QUFBWixXQUFZLEtBQUs7SUFDZixnREFBdUMsQ0FBQTtJQUN2QyxrREFBeUMsQ0FBQTtJQUN6QyxzREFBNkMsQ0FBQTtJQUM3Qyx1Q0FBOEIsQ0FBQTtBQUNoQyxDQUFDLEVBTFdBLGFBQUssS0FBTEEsYUFBSyxRQUtoQjtBQUVX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
