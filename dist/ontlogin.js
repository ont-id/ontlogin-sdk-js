
  /**
   * @license
   * author: yuanzeyu@onchain.com
   * ontlogin.js v0.0.2
   * Released under the ISC license.
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
    exports.getRequest = getRequest;
    exports.postRequest = postRequest;
    exports.queryQRResult = queryQRResult;
    exports.requestQR = requestQR;
    exports.wait = wait;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIEF1dGhvcml6YXRpb24gPSBcImF1dGhvcml6YXRpb25cIixcbn1cblxuZXhwb3J0IGVudW0gRXJyb3Ige1xuICBWZXJzaW9uTm90U3VwcG9ydCA9IFwiRVJSX1dST05HX1ZFUlNJT05cIixcbiAgVHlwZU5vdFN1cHBvcnQgPSBcIkVSUl9UWVBFX05PVF9TVVBQT1JURURcIixcbiAgQWN0aW9uTm90U3VwcG9ydCA9IFwiRVJSX0FDVElPTl9OT1RfU1VQUE9SVEVEXCIsXG4gIFVua25vd25FcnJvciA9IFwiRVJSX1VOREVGSU5FRFwiLFxufVxuXG5leHBvcnQgZW51bSBRclN0YXR1cyB7XG4gIFBlbmRpbmcsXG4gIFN1Y2Nlc3MsXG4gIEZhaWwsXG59XG5cbmV4cG9ydCBlbnVtIFJlcXVlc3RVcmwge1xuICBnZXRRciA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9jaGFsbGVuZ2VcIixcbiAgZ2V0UXJSZXN1bHQgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvcmVzdWx0XCIsXG59XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcywgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNvbnN0IHBvc3RSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBwYXJhbXM6IGFueSk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9LFxuICB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFJlcXVlc3QgPSBhc3luYyA8VD4odXJsOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2goYCR7dXJsfS8ke3BhdGh9YCkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbmV4cG9ydCBjb25zdCB3YWl0ID0gKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4gPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9LCB0aW1lKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHtcbiAgQXV0aENoYWxsZW5nZSxcbiAgQXV0aFJlcXVlc3QsXG4gIENoYWxsZW5nZVJlc3BvbnNlLFxuICBRclJlc3VsdCxcbn0gZnJvbSBcIi4vdHlwZVwiO1xuaW1wb3J0IHsgQWN0aW9uLCBNZXNzYWdlVHlwZSwgUXJTdGF0dXMsIFJlcXVlc3RVcmwsIFZlcnNpb24gfSBmcm9tIFwiLi9lbnVtXCI7XG5pbXBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCB7IHdhaXQsIHBvc3RSZXF1ZXN0LCBnZXRSZXF1ZXN0IH0gZnJvbSBcIi4vdXRpbHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2VudW1cIjtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3RcbiAqIEBkZXNjIFJlZmVyIHRvIGh0dHBzOi8vb250b2xvZ3ktMS5naXRib29rLmlvL29udC1sb2dpbi90dXRvcmlhbHMvZ2V0LXN0YXJ0ZWQjc2VuZC1hdXRoZW50aWNhdGlvbi1yZXF1ZXN0XG4gKiBAcGFyYW0gYWN0aW9ucyAtIHN1cHBvcnQgYWN0aW9ucyhlLmcuLCBbJ2F1dGhvcml6YXRpb24nXSksIGVtcHR5IGJ5IGRlZmF1bHRcbiAqIEByZXR1cm5zIEF1dGhSZXF1ZXN0XG4gKiBAYmV0YVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoYWN0aW9uczogQWN0aW9uW10gPSBbXSk6IEF1dGhSZXF1ZXN0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXI6IFZlcnNpb24uVmVyc2lvbjEsXG4gICAgdHlwZTogTWVzc2FnZVR5cGUuQ2xpZW50SGVsbG8sXG4gICAgYWN0aW9uOiBhY3Rpb25zLmluY2x1ZGVzKEFjdGlvbi5BdXRob3JpemF0aW9uKSA/IFwiMVwiIDogXCIwXCIsIC8vIHRvZG8gY29uZmlybSBhY3Rpb25cbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IFFSIHdpdGggQXV0aENoYWxsZW5nZVxuICogQGRlc2MgUmVmZXIgdG8gdXJsLXRvLXNjYW4tc2VydmVyLWRvY1xuICogQHBhcmFtIGNoYWxsZW5nZSAtIEF1dGhDaGFsbGVuZ2VcbiAqIEByZXR1cm5zIFFSIFRleHQgYW5kIFFSIGlkXG4gKiBAYmV0YVxuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdFFSID0gYXN5bmMgKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2Vcbik6IFByb21pc2U8UXJSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBwb3N0UmVxdWVzdChcbiAgICBSZXF1ZXN0VXJsLmdldFFyLFxuICAgIGNoYWxsZW5nZVxuICApO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogcmVzdWx0LmlkLFxuICAgIHRleHQ6IHJlc3VsdC5xckNvZGUsXG4gIH07XG59O1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdFxuICogQGRlc2MgRmV0Y2ggUVIgcmVzdWx0IHVudGlsIGdldCByZXN1bHQgb3IgZXJyb3JcbiAqIEBwYXJhbSBpZCAtIFFSIGlkXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uIGJldHdlZW4gZWFjaCByZXF1ZXN0XG4gKiBAcmV0dXJucyBDaGFsbGVuZ2VSZXNwb25zZSwgcmVmZXIgdG8gZG9jLXVybC10by1DaGFsbGVuZ2VSZXNwb25zZVxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMFxuKTogUHJvbWlzZTxDaGFsbGVuZ2VSZXNwb25zZT4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IGdldFJlcXVlc3QoUmVxdWVzdFVybC5nZXRRclJlc3VsdCwgaWQpO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuUGVuZGluZykge1xuICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgIHJldHVybiBxdWVyeVFSUmVzdWx0KGlkKTtcbiAgfVxuICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVzdWx0LmNsaWVudFJlc3BvbnNlKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbn07XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3IiLCJRclN0YXR1cyIsIlJlcXVlc3RVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQVlBO0lBQVosV0FBWSxPQUFPO1FBQ2pCLDJCQUFnQixDQUFBO0lBQ2xCLENBQUMsRUFGV0EsZUFBTyxLQUFQQSxlQUFPLFFBRWxCO0FBRVdDO0lBQVosV0FBWSxXQUFXO1FBQ3JCLDBDQUEyQixDQUFBO1FBQzNCLDBDQUEyQixDQUFBO1FBQzNCLGdEQUFpQyxDQUFBO0lBQ25DLENBQUMsRUFKV0EsbUJBQVcsS0FBWEEsbUJBQVcsUUFJdEI7SUFFRDs7O0FBR1lDO0lBQVosV0FBWSxNQUFNO1FBQ2hCLHlDQUErQixDQUFBO0lBQ2pDLENBQUMsRUFGV0EsY0FBTSxLQUFOQSxjQUFNLFFBRWpCO0FBRVdDO0lBQVosV0FBWSxLQUFLO1FBQ2YsZ0RBQXVDLENBQUE7UUFDdkMsa0RBQXlDLENBQUE7UUFDekMsc0RBQTZDLENBQUE7UUFDN0MsdUNBQThCLENBQUE7SUFDaEMsQ0FBQyxFQUxXQSxhQUFLLEtBQUxBLGFBQUssUUFLaEI7QUFFV0M7SUFBWixXQUFZLFFBQVE7UUFDbEIsNkNBQU8sQ0FBQTtRQUNQLDZDQUFPLENBQUE7UUFDUCx1Q0FBSSxDQUFBO0lBQ04sQ0FBQyxFQUpXQSxnQkFBUSxLQUFSQSxnQkFBUSxRQUluQjtBQUVXQztJQUFaLFdBQVksVUFBVTtRQUNwQixvRUFBc0QsQ0FBQTtRQUN0RCx1RUFBeUQsQ0FBQTtJQUMzRCxDQUFDLEVBSFdBLGtCQUFVLEtBQVZBLGtCQUFVOztJQzlCdEI7VUFDYSxXQUFXLEdBQUcsT0FBVSxHQUFXLEVBQUUsTUFBVztRQUMzRCxPQUFPLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDaEIsTUFBTSxFQUFFLE1BQU07WUFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFD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
