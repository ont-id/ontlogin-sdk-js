
  /**
   * @license
   * author: yuanzeyu@onchain.com
   * ontlogin.js v0.0.5
   * Released under the ISC license.
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
var Error$1;
(function (Error) {
    Error["VersionNotSupport"] = "ERR_WRONG_VERSION";
    Error["TypeNotSupport"] = "ERR_TYPE_NOT_SUPPORTED";
    Error["ActionNotSupport"] = "ERR_ACTION_NOT_SUPPORTED";
    Error["UnknownError"] = "ERR_UNDEFINED";
})(Error$1 || (Error$1 = {}));
var QrStatus;
(function (QrStatus) {
    QrStatus[QrStatus["Pending"] = 0] = "Pending";
    QrStatus[QrStatus["Success"] = 1] = "Success";
    QrStatus[QrStatus["Fail"] = 2] = "Fail";
})(QrStatus || (QrStatus = {}));
var RequestUrl;
(function (RequestUrl) {
    RequestUrl["getQr"] = "http://172.168.3.240:31843/qr-code/challenge";
    RequestUrl["getQrResult"] = "http://172.168.3.240:31843/qr-code/result";
})(RequestUrl || (RequestUrl = {}));

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
        ver: Version.Version1,
        type: MessageType.ClientHello,
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
    const { result, error, desc } = await postRequest(RequestUrl.getQr, challenge);
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
    const { result, error, desc } = await getRequest(RequestUrl.getQrResult, id);
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

export { Action, Error$1 as Error, MessageType, QrStatus, RequestUrl, Version, createAuthRequest, createSignData, getRequest, postRequest, queryQRResult, requestQR, wait };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yIHtcbiAgVmVyc2lvbk5vdFN1cHBvcnQgPSBcIkVSUl9XUk9OR19WRVJTSU9OXCIsXG4gIFR5cGVOb3RTdXBwb3J0ID0gXCJFUlJfVFlQRV9OT1RfU1VQUE9SVEVEXCIsXG4gIEFjdGlvbk5vdFN1cHBvcnQgPSBcIkVSUl9BQ1RJT05fTk9UX1NVUFBPUlRFRFwiLFxuICBVbmtub3duRXJyb3IgPSBcIkVSUl9VTkRFRklORURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UXIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFyUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXMsIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGFyYW1zOiBhbnkpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogXCJwb3N0XCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGFyYW1zKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKGAke3VybH0vJHtwYXRofWApLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBDaGFsbGVuZ2VSZXNwb25zZSxcbiAgUXJSZXN1bHQsXG4gIFNpZ25EYXRhLFxufSBmcm9tIFwiLi90eXBlXCI7XG5pbXBvcnQgeyBBY3Rpb24sIE1lc3NhZ2VUeXBlLCBRclN0YXR1cywgUmVxdWVzdFVybCwgVmVyc2lvbiB9IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IHdhaXQsIHBvc3RSZXF1ZXN0LCBnZXRSZXF1ZXN0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3RcbiAqIEBkZXNjIFJlZmVyIHRvIGh0dHBzOi8vb250b2xvZ3ktMS5naXRib29rLmlvL29udC1sb2dpbi90dXRvcmlhbHMvZ2V0LXN0YXJ0ZWQjc2VuZC1hdXRoZW50aWNhdGlvbi1yZXF1ZXN0XG4gKiBAcGFyYW0gYWN0aW9uIC0gQWN0aW9uIDAtSWRBdXRoIDEtSWRBdXRoIGFuZCBWY0F1dGhcbiAqIEByZXR1cm5zIEF1dGhSZXF1ZXN0XG4gKiBAYmV0YVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoYWN0aW9uOiBBY3Rpb24pOiBBdXRoUmVxdWVzdCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmVyOiBWZXJzaW9uLlZlcnNpb24xLFxuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNsaWVudEhlbGxvLFxuICAgIGFjdGlvbixcbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IFFSIHdpdGggQXV0aENoYWxsZW5nZVxuICogQHBhcmFtIGNoYWxsZW5nZSAtIEF1dGhDaGFsbGVuZ2VcbiAqIEByZXR1cm5zIFFSIFRleHQgYW5kIFFSIGlkXG4gKiBAYmV0YVxuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdFFSID0gYXN5bmMgKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2Vcbik6IFByb21pc2U8UXJSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBwb3N0UmVxdWVzdChcbiAgICBSZXF1ZXN0VXJsLmdldFFyLFxuICAgIGNoYWxsZW5nZVxuICApO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogcmVzdWx0LmlkLFxuICAgIHRleHQ6IHJlc3VsdC5xckNvZGUsXG4gIH07XG59O1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdFxuICogQGRlc2MgRmV0Y2ggUVIgcmVzdWx0IHVudGlsIGdldCByZXN1bHQgb3IgZXJyb3JcbiAqIEBwYXJhbSBpZCAtIFFSIGlkXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uIGJldHdlZW4gZWFjaCByZXF1ZXN0XG4gKiBAcmV0dXJucyBDaGFsbGVuZ2VSZXNwb25zZSwgcmVmZXIgdG8gZG9jLXVybC10by1DaGFsbGVuZ2VSZXNwb25zZVxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMFxuKTogUHJvbWlzZTxDaGFsbGVuZ2VSZXNwb25zZT4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IGdldFJlcXVlc3QoUmVxdWVzdFVybC5nZXRRclJlc3VsdCwgaWQpO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuUGVuZGluZykge1xuICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgIHJldHVybiBxdWVyeVFSUmVzdWx0KGlkKTtcbiAgfVxuICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVzdWx0LmNsaWVudFJlc3BvbnNlKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbn07XG5cbi8qKlxuICogY3JlYXRlIHNpZ25EYXRhXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gQXV0aENoYWxsZW5nZVxuICogQHBhcmFtIGFjY291bnQgLSBzaWduZXIgZGlkXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YSA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhID0+ICh7XG4gIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgc2VydmVyOiB7XG4gICAgbmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgLi4uKGNoYWxsZW5nZS5zZXJ2ZXIuZGlkID8geyBkaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkIH0gOiB7fSksXG4gIH0sXG4gIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gIGRpZDogYWNjb3VudCxcbiAgY3JlYXRlZDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG59KTtcbiJdLCJuYW1lcyI6WyJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFBWTtBQUFaLFdBQVksT0FBTztJQUNqQiwyQkFBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBRlcsT0FBTyxLQUFQLE9BQU8sUUFFbEI7SUFFVztBQUFaLFdBQVksV0FBVztJQUNyQiwwQ0FBMkIsQ0FBQTtJQUMzQiwwQ0FBMkIsQ0FBQTtJQUMzQixnREFBaUMsQ0FBQTtBQUNuQyxDQUFDLEVBSlcsV0FBVyxLQUFYLFdBQVcsUUFJdEI7QUFFRDs7O0lBR1k7QUFBWixXQUFZLE1BQU07SUFDaEIsdUNBQVUsQ0FBQTtJQUNWLHlEQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFIVyxNQUFNLEtBQU4sTUFBTSxRQUdqQjtJQUVXQTtBQUFaLFdBQVksS0FBSztJQUNmLGdEQUF1QyxDQUFBO0lBQ3ZDLGtEQUF5QyxDQUFBO0lBQ3pDLHNEQUE2QyxDQUFBO0lBQzdDLHVDQUE4QixDQUFBO0FBQ2hDLENBQUMsRUFMV0EsT0FBSyxLQUFMQSxPQUFLLFFBS2hCO0lBRVc7QUFBWixXQUFZLFFBQVE7SUFDbEIsNkNBQU8sQ0FBQTtJQUNQLDZDQUFPLENBQUE7SUFDUCx1Q0FBSSxDQUFBO0FBQ04sQ0FB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
