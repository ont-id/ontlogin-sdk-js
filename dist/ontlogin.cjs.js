
  /**
   * @license
   * author: yuanzeyu@onchain.com
   * ontlogin.js v0.0.1
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
    Action["Authorization"] = "authorization";
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
 * @param actions - support actions(e.g., ['authorization']), empty by default
 * @returns AuthRequest
 * @beta
 */
const createAuthRequest = (actions = []) => {
    return {
        ver: exports.Version.Version1,
        type: exports.MessageType.ClientHello,
        action: actions.includes(exports.Action.Authorization) ? "1" : "0", // todo confirm action
    };
};
/**
 * Get QR with AuthChallenge
 * @desc Refer to url-to-scan-server-doc
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

exports.createAuthRequest = createAuthRequest;
exports.queryQRResult = queryQRResult;
exports.requestQR = requestQR;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvZW51bS50cyIsIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgVmVyc2lvbjEgPSBcIjEuMFwiLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XG4gIENsaWVudEhlbGxvID0gXCJDbGllbnRIZWxsb1wiLFxuICBTZXJ2ZXJIZWxsbyA9IFwiU2VydmVySGVsbG9cIixcbiAgQ2xpZW50UmVzcG9uc2UgPSBcIkNsaWVudFJlc3BvbnNlXCIsXG59XG5cbi8qKlxuICogYWN0aW9uIGVudW1zIGZvciBjcmVhdGVBdXRoUmVxdWVzdFxuICovXG5leHBvcnQgZW51bSBBY3Rpb24ge1xuICBBdXRob3JpemF0aW9uID0gXCJhdXRob3JpemF0aW9uXCIsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yIHtcbiAgVmVyc2lvbk5vdFN1cHBvcnQgPSBcIkVSUl9XUk9OR19WRVJTSU9OXCIsXG4gIFR5cGVOb3RTdXBwb3J0ID0gXCJFUlJfVFlQRV9OT1RfU1VQUE9SVEVEXCIsXG4gIEFjdGlvbk5vdFN1cHBvcnQgPSBcIkVSUl9BQ1RJT05fTk9UX1NVUFBPUlRFRFwiLFxuICBVbmtub3duRXJyb3IgPSBcIkVSUl9VTkRFRklORURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UXIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFyUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXMsIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGFyYW1zOiBhbnkpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogXCJwb3N0XCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGFyYW1zKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKGAke3VybH0vJHtwYXRofWApLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBDaGFsbGVuZ2VSZXNwb25zZSxcbiAgUXJSZXN1bHQsXG59IGZyb20gXCIuL3R5cGVcIjtcbmltcG9ydCB7IEFjdGlvbiwgTWVzc2FnZVR5cGUsIFFyU3RhdHVzLCBSZXF1ZXN0VXJsLCBWZXJzaW9uIH0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5cbi8qKlxuICogQ3JlYXRlIEF1dGhSZXF1ZXN0XG4gKiBAZGVzYyBSZWZlciB0byBodHRwczovL29udG9sb2d5LTEuZ2l0Ym9vay5pby9vbnQtbG9naW4vdHV0b3JpYWxzL2dldC1zdGFydGVkI3NlbmQtYXV0aGVudGljYXRpb24tcmVxdWVzdFxuICogQHBhcmFtIGFjdGlvbnMgLSBzdXBwb3J0IGFjdGlvbnMoZS5nLiwgWydhdXRob3JpemF0aW9uJ10pLCBlbXB0eSBieSBkZWZhdWx0XG4gKiBAcmV0dXJucyBBdXRoUmVxdWVzdFxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUF1dGhSZXF1ZXN0ID0gKGFjdGlvbnM6IEFjdGlvbltdID0gW10pOiBBdXRoUmVxdWVzdCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmVyOiBWZXJzaW9uLlZlcnNpb24xLFxuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNsaWVudEhlbGxvLFxuICAgIGFjdGlvbjogYWN0aW9ucy5pbmNsdWRlcyhBY3Rpb24uQXV0aG9yaXphdGlvbikgPyBcIjFcIiA6IFwiMFwiLCAvLyB0b2RvIGNvbmZpcm0gYWN0aW9uXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIEF1dGhDaGFsbGVuZ2VcbiAqIEBkZXNjIFJlZmVyIHRvIHVybC10by1zY2FuLXNlcnZlci1kb2NcbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBBdXRoQ2hhbGxlbmdlXG4gKiBAcmV0dXJucyBRUiBUZXh0IGFuZCBRUiBpZFxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlXG4pOiBQcm9taXNlPFFyUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgUmVxdWVzdFVybC5nZXRRcixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHRcbiAqIEBkZXNjIEZldGNoIFFSIHJlc3VsdCB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yXG4gKiBAcGFyYW0gaWQgLSBRUiBpZFxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbiBiZXR3ZWVuIGVhY2ggcmVxdWVzdFxuICogQHJldHVybnMgQ2hhbGxlbmdlUmVzcG9uc2UsIHJlZmVyIHRvIGRvYy11cmwtdG8tQ2hhbGxlbmdlUmVzcG9uc2VcbiAqIEBiZXRhXG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVFSUmVzdWx0ID0gYXN5bmMgKFxuICBpZDogc3RyaW5nLFxuICBkdXJhdGlvbiA9IDEwMDBcbik6IFByb21pc2U8Q2hhbGxlbmdlUmVzcG9uc2U+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFJlcXVlc3RVcmwuZ2V0UXJSZXN1bHQsIGlkKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG59O1xuIl0sIm5hbWVzIjpb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
