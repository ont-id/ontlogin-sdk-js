
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

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yIHtcbiAgVmVyc2lvbk5vdFN1cHBvcnQgPSBcIkVSUl9XUk9OR19WRVJTSU9OXCIsXG4gIFR5cGVOb3RTdXBwb3J0ID0gXCJFUlJfVFlQRV9OT1RfU1VQUE9SVEVEXCIsXG4gIEFjdGlvbk5vdFN1cHBvcnQgPSBcIkVSUl9BQ1RJT05fTk9UX1NVUFBPUlRFRFwiLFxuICBVbmtub3duRXJyb3IgPSBcIkVSUl9VTkRFRklORURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG4vKipcbiAqIE9udGxvZ2luIFFSIHNlcnZlciB1cmxzLlxuICogQGJldGFcbiAqL1xuZXhwb3J0IGVudW0gUmVxdWVzdFVybCB7XG4gIGdldFFSID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL2NoYWxsZW5nZVwiLFxuICBnZXRRUlJlc3VsdCA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9yZXN1bHRcIixcbn1cbiIsIi8qKlxuICogUG9zdCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gYm9keSBSZXF1ZXN0IGJvZHkuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY29uc3QgcG9zdFJlcXVlc3QgPSBhc3luYyA8VD4odXJsOiBzdHJpbmcsIGJvZHk6IGFueSk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gZmV0Y2godXJsLCB7XG4gICAgbWV0aG9kOiBcInBvc3RcIixcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSkudGhlbigocmVzKSA9PiByZXMuanNvbigpKTtcbn07XG5cbi8qKlxuICogR2V0IHJlcXVlc3QgaW4ganNvbiwgYSBzaW1wbGUgd3JhcHBlciBvZiBmZXRjaC5cbiAqIEB0eXBlUGFyYW0gVCBSZXNwb25zZSB0eXBlLlxuICogQHBhcmFtIHVybCBSZXF1ZXN0IHVybC5cbiAqIEBwYXJhbSBwYXRoIFJlcXVlc3QgcGF0aCBpLmUuICdpZCcgb3IgJ25ld3MvaWQnLlxuICogQHJldHVybiBQcm9taXNlIHJlc3BvbnNlLlxuICovXG5leHBvcnQgY29uc3QgZ2V0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaChgJHt1cmx9LyR7cGF0aH1gKS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBBc3luYyB3YWl0IHNvbWUgdGltZS5cbiAqIEBwYXJhbSB0aW1lIFNlY29uZCBhbW91bnQuXG4gKi9cbmV4cG9ydCBjb25zdCB3YWl0ID0gKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4gPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9LCB0aW1lKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHtcbiAgQXV0aENoYWxsZW5nZSxcbiAgQXV0aFJlcXVlc3QsXG4gIEF1dGhSZXNwb25zZSxcbiAgUVJSZXN1bHQsXG4gIFNpZ25EYXRhLFxufSBmcm9tIFwiLi90eXBlXCI7XG5pbXBvcnQgeyBBY3Rpb24sIE1lc3NhZ2VUeXBlLCBRclN0YXR1cywgUmVxdWVzdFVybCwgVmVyc2lvbiB9IGZyb20gXCIuL2VudW1cIjtcbmltcG9ydCB7IGdldFJlcXVlc3QsIHBvc3RSZXF1ZXN0LCB3YWl0IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vdHlwZVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZW51bVwiO1xuZXhwb3J0IHsgd2FpdCwgcG9zdFJlcXVlc3QsIGdldFJlcXVlc3QgfTtcblxuLyoqXG4gKiBDcmVhdGUgQXV0aFJlcXVlc3QuXG4gKiBAcGFyYW0gYWN0aW9uIC0gVGhlIGFjdGlvbiB0eXBlLlxuICogQHJldHVybiBUaGUgQXV0aFJlcXVlc3QgZm9yIGdldCBBdXRoQ2hhbGxlbmdlLlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGF1dGhSZXF1ZXN0OiBBdXRoUmVxdWVzdCA9IGNyZWF0ZUF1dGhSZXF1ZXN0KEFjdGlvbi5JZEF1dGhBbmRWY0F1dGgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVBdXRoUmVxdWVzdCA9IChcbiAgYWN0aW9uOiBBY3Rpb24gPSBBY3Rpb24uSWRBdXRoXG4pOiBBdXRoUmVxdWVzdCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmVyOiBWZXJzaW9uLlZlcnNpb24xLFxuICAgIHR5cGU6IE1lc3NhZ2VUeXBlLkNsaWVudEhlbGxvLFxuICAgIGFjdGlvbixcbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IFFSIHdpdGggdGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBvbnRvbG9naW4gUVIgc2VydmVyLlxuICogQHBhcmFtIGNoYWxsZW5nZSAtIFRoZSBBdXRoQ2hhbGxlbmdlIGZyb20geW91ciBzZXJ2ZXIuXG4gKiBAcmV0dXJuIFRleHQgZm9yIGdlbmVyYXRpbmcgdGhlIFFSIGNvZGUgYW5kIGlkIGZvciBxdWVyeSBzY2FuIHJlc3VsdC5cbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB7IHRleHQsIGlkIH0gPSBhd2FpdCByZXF1ZXN0UVIoY2hhbGxlbmdlKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdFFSID0gYXN5bmMgKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2Vcbik6IFByb21pc2U8UVJSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBwb3N0UmVxdWVzdChcbiAgICBSZXF1ZXN0VXJsLmdldFFSLFxuICAgIGNoYWxsZW5nZVxuICApO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogcmVzdWx0LmlkLFxuICAgIHRleHQ6IHJlc3VsdC5xckNvZGUsXG4gIH07XG59O1xuXG4vKipcbiAqIFF1ZXJ5IFFSIHJlc3VsdCBmcm9tIG9udGxvZ2luIFFSIHNlcnZlciB1bnRpbCBnZXQgcmVzdWx0IG9yIGVycm9yLlxuICogQHBhcmFtIGlkIC0gUVIgaWQuXG4gKiBAcGFyYW0gZHVyYXRpb24gLSBUaW1lIGR1cmF0aW9uKG1zKSBiZXR3ZWVuIGVhY2ggcmVxdWVzdCgxMDAwIGJ5IGRlZmF1bHQpLlxuICogQHJldHVybiBUaGUgQXV0aFJlc3BvbnNlIGZvciBzdWJtaXQgdG8gc2VydmVyLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlRUlJlc3VsdCA9IGFzeW5jIChcbiAgaWQ6IHN0cmluZyxcbiAgZHVyYXRpb24gPSAxMDAwXG4pOiBQcm9taXNlPEF1dGhSZXNwb25zZT4gPT4ge1xuICBjb25zdCB7IHJlc3VsdCwgZXJyb3IsIGRlc2MgfSA9IGF3YWl0IGdldFJlcXVlc3QoUmVxdWVzdFVybC5nZXRRUlJlc3VsdCwgaWQpO1xuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZGVzYyk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuUGVuZGluZykge1xuICAgIGF3YWl0IHdhaXQoZHVyYXRpb24pO1xuICAgIHJldHVybiBxdWVyeVFSUmVzdWx0KGlkKTtcbiAgfVxuICBpZiAocmVzdWx0LnN0YXRlID09PSBRclN0YXR1cy5TdWNjZXNzKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVzdWx0LmNsaWVudFJlc3BvbnNlKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0LmVycm9yKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBvYmplY3QgZm9yIHRoZSB3YWxsZXQgdG8gc2lnbi5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHNlcnZlci5cbiAqIEBwYXJhbSBhY2NvdW50IC0gU2lnbmVyIGRpZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVNpZ25EYXRhID0gKFxuICBjaGFsbGVuZ2U6IEF1dGhDaGFsbGVuZ2UsXG4gIGFjY291bnQ6IHN0cmluZ1xuKTogU2lnbkRhdGEgPT4gKHtcbiAgdHlwZTogXCJDbGllbnRSZXNwb25zZVwiLFxuICBzZXJ2ZXI6IHtcbiAgICBuYW1lOiBjaGFsbGVuZ2Uuc2VydmVyLm5hbWUsXG4gICAgdXJsOiBjaGFsbGVuZ2Uuc2VydmVyLnVybCxcbiAgICAuLi4oY2hhbGxlbmdlLnNlcnZlci5kaWQgPyB7IGRpZDogY2hhbGxlbmdlLnNlcnZlci5kaWQgfSA6IHt9KSxcbiAgfSxcbiAgbm9uY2U6IGNoYWxsZW5nZS5ub25jZSxcbiAgZGlkOiBhY2NvdW50LFxuICBjcmVhdGVkOiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbn0pO1xuIl0sIm5hbWVzIjpbIlZlcnNpb24iLCJNZXNzYWdlVHlwZSIsIkFjdGlvbiIsIkVycm9yIiwiUXJTdGF0dXMiLCJSZXF1ZXN0VXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVlBO0lBQVosV0FBWSxPQUFPO1FBQ2pCLDJCQUFnQixDQUFBO0lBQ2xCLENBQUMsRUFGV0EsZUFBTyxLQUFQQSxlQUFPLFFBRWxCO0FBRVdDO0lBQVosV0FBWSxXQUFXO1FBQ3JCLDBDQUEyQixDQUFBO1FBQzNCLDBDQUEyQixDQUFBO1FBQzNCLGdEQUFpQyxDQUFBO0lBQ25DLENBQUMsRUFKV0EsbUJBQVcsS0FBWEEsbUJBQVcsUUFJdEI7SUFFRDs7O0FBR1lDO0lBQVosV0FBWSxNQUFNO1FBQ2hCLHVDQUFVLENBQUE7UUFDVix5REFBbUIsQ0FBQTtJQUNyQixDQUFDLEVBSFdBLGNBQU0sS0FBTkEsY0FBTSxRQUdqQjtBQUVXQztJQUFaLFdBQVksS0FBSztRQUNmLGdEQUF1QyxDQUFBO1FBQ3ZDLGtEQUF5QyxDQUFBO1FBQ3pDLHNEQUE2QyxDQUFBO1FBQzdDLHVDQUE4QixDQUFBO0lBQ2hDLENBQUMsRUFMV0EsYUFBSyxLQUFMQSxhQUFLLFFBS2hCO0FBRVdDO0lBQVosV0FBWSxRQUFRO1FBQ2xCLDZDQUFPLENBQUE7UUFDUCw2Q0FBTyxDQUFBO1FBQ1AsdUNBQUksQ0FBQTtJQUNOLENBQUMsRUFKV0EsZ0JBQVEsS0FBUkEsZ0JBQVEsUUFJbkI7SUFFRDs7OztBQUlZQztJQUFaLFdBQVksVUFBVTtRQUNwQixvRUFBc0QsQ0FBQTtRQUN0RCx1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
