
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
    const createAuthRequest = (action = exports.Action.IdAuth) => {
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

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yIHtcbiAgVmVyc2lvbk5vdFN1cHBvcnQgPSBcIkVSUl9XUk9OR19WRVJTSU9OXCIsXG4gIFR5cGVOb3RTdXBwb3J0ID0gXCJFUlJfVFlQRV9OT1RfU1VQUE9SVEVEXCIsXG4gIEFjdGlvbk5vdFN1cHBvcnQgPSBcIkVSUl9BQ1RJT05fTk9UX1NVUFBPUlRFRFwiLFxuICBVbmtub3duRXJyb3IgPSBcIkVSUl9VTkRFRklORURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG5leHBvcnQgZW51bSBSZXF1ZXN0VXJsIHtcbiAgZ2V0UXIgPSBcImh0dHA6Ly8xNzIuMTY4LjMuMjQwOjMxODQzL3FyLWNvZGUvY2hhbGxlbmdlXCIsXG4gIGdldFFyUmVzdWx0ID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL3Jlc3VsdFwiLFxufVxuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXMsIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGFyYW1zOiBhbnkpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogXCJwb3N0XCIsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGFyYW1zKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKGAke3VybH0vJHtwYXRofWApLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG5leHBvcnQgY29uc3Qgd2FpdCA9ICh0aW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSwgdGltZSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7XG4gIEF1dGhDaGFsbGVuZ2UsXG4gIEF1dGhSZXF1ZXN0LFxuICBDaGFsbGVuZ2VSZXNwb25zZSxcbiAgUXJSZXN1bHQsXG4gIFNpZ25EYXRhLFxufSBmcm9tIFwiLi90eXBlXCI7XG5pbXBvcnQgeyBBY3Rpb24sIE1lc3NhZ2VUeXBlLCBRclN0YXR1cywgUmVxdWVzdFVybCwgVmVyc2lvbiB9IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IGdldFJlcXVlc3QsIHBvc3RSZXF1ZXN0LCB3YWl0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3RcbiAqIEBkZXNjIFJlZmVyIHRvIGh0dHBzOi8vb250b2xvZ3ktMS5naXRib29rLmlvL29udC1sb2dpbi90dXRvcmlhbHMvZ2V0LXN0YXJ0ZWQjc2VuZC1hdXRoZW50aWNhdGlvbi1yZXF1ZXN0XG4gKiBAcGFyYW0gYWN0aW9uIC0gQWN0aW9uIDAtSWRBdXRoIDEtSWRBdXRoIGFuZCBWY0F1dGhcbiAqIEByZXR1cm5zIEF1dGhSZXF1ZXN0XG4gKiBAYmV0YVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoXG4gIGFjdGlvbjogQWN0aW9uID0gQWN0aW9uLklkQXV0aFxuKTogQXV0aFJlcXVlc3QgPT4ge1xuICByZXR1cm4ge1xuICAgIHZlcjogVmVyc2lvbi5WZXJzaW9uMSxcbiAgICB0eXBlOiBNZXNzYWdlVHlwZS5DbGllbnRIZWxsbyxcbiAgICBhY3Rpb24sXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIEF1dGhDaGFsbGVuZ2VcbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBBdXRoQ2hhbGxlbmdlXG4gKiBAcmV0dXJucyBRUiBUZXh0IGFuZCBRUiBpZFxuICogQGJldGFcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlXG4pOiBQcm9taXNlPFFyUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgUmVxdWVzdFVybC5nZXRRcixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHRcbiAqIEBkZXNjIEZldGNoIFFSIHJlc3VsdCB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yXG4gKiBAcGFyYW0gaWQgLSBRUiBpZFxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbiBiZXR3ZWVuIGVhY2ggcmVxdWVzdFxuICogQHJldHVybnMgQ2hhbGxlbmdlUmVzcG9uc2UsIHJlZmVyIHRvIGRvYy11cmwtdG8tQ2hhbGxlbmdlUmVzcG9uc2VcbiAqIEBiZXRhXG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVFSUmVzdWx0ID0gYXN5bmMgKFxuICBpZDogc3RyaW5nLFxuICBkdXJhdGlvbiA9IDEwMDBcbik6IFByb21pc2U8Q2hhbGxlbmdlUmVzcG9uc2U+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFJlcXVlc3RVcmwuZ2V0UXJSZXN1bHQsIGlkKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG59O1xuXG4vKipcbiAqIGNyZWF0ZSBzaWduRGF0YVxuICogQHBhcmFtIGNoYWxsZW5nZSAtIEF1dGhDaGFsbGVuZ2VcbiAqIEBwYXJhbSBhY2NvdW50IC0gc2lnbmVyIGRpZFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlU2lnbkRhdGEgPSAoXG4gIGNoYWxsZW5nZTogQXV0aENoYWxsZW5nZSxcbiAgYWNjb3VudDogc3RyaW5nXG4pOiBTaWduRGF0YSA9PiAoe1xuICB0eXBlOiBcIkNsaWVudFJlc3BvbnNlXCIsXG4gIHNlcnZlcjoge1xuICAgIG5hbWU6IGNoYWxsZW5nZS5zZXJ2ZXIubmFtZSxcbiAgICB1cmw6IGNoYWxsZW5nZS5zZXJ2ZXIudXJsLFxuICAgIC4uLihjaGFsbGVuZ2Uuc2VydmVyLmRpZCA/IHsgZGlkOiBjaGFsbGVuZ2Uuc2VydmVyLmRpZCB9IDoge30pLFxuICB9LFxuICBub25jZTogY2hhbGxlbmdlLm5vbmNlLFxuICBkaWQ6IGFjY291bnQsXG4gIGNyZWF0ZWQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxufSk7XG4iXSwibmFtZXMiOlsiVmVyc2lvbiIsIk1lc3NhZ2VUeXBlIiwiQWN0aW9uIiwiRXJyb3IiLCJRclN0YXR1cyIsIlJlcXVlc3RVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBWUE7SUFBWixXQUFZLE9BQU87UUFDakIsMkJBQWdCLENBQUE7SUFDbEIsQ0FBQyxFQUZXQSxlQUFPLEtBQVBBLGVBQU8sUUFFbEI7QUFFV0M7SUFBWixXQUFZLFdBQVc7UUFDckIsMENBQTJCLENBQUE7UUFDM0IsMENBQTJCLENBQUE7UUFDM0IsZ0RBQWlDLENBQUE7SUFDbkMsQ0FBQyxFQUpXQSxtQkFBVyxLQUFYQSxtQkFBVyxRQUl0QjtJQUVEOzs7QUFHWUM7SUFBWixXQUFZLE1BQU07UUFDaEIsdUNBQVUsQ0FBQTtRQUNWLHlEQUFtQixDQUFBO0lBQ3JCLENBQUMsRUFIV0EsY0FBTSxLQUFOQSxjQUFNLFFBR2pCO0FBRVdDO0lBQVosV0FBWSxLQUFLO1FBQ2YsZ0RBQXVDLENBQUE7UUFDdkMsa0RBQXlDLENBQUE7UUFDekMsc0RBQTZDLENBQUE7UUFDN0MsdUNBQThCLENBQUE7SUFDaEMsQ0FBQyxFQUxX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
