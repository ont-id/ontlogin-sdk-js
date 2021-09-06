
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

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib250bG9naW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9lbnVtLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICBWZXJzaW9uMSA9IFwiMS4wXCIsXG59XG5cbmV4cG9ydCBlbnVtIE1lc3NhZ2VUeXBlIHtcbiAgQ2xpZW50SGVsbG8gPSBcIkNsaWVudEhlbGxvXCIsXG4gIFNlcnZlckhlbGxvID0gXCJTZXJ2ZXJIZWxsb1wiLFxuICBDbGllbnRSZXNwb25zZSA9IFwiQ2xpZW50UmVzcG9uc2VcIixcbn1cblxuLyoqXG4gKiBhY3Rpb24gZW51bXMgZm9yIGNyZWF0ZUF1dGhSZXF1ZXN0XG4gKi9cbmV4cG9ydCBlbnVtIEFjdGlvbiB7XG4gIElkQXV0aCA9IDAsXG4gIElkQXV0aEFuZFZjQXV0aCA9IDEsXG59XG5cbmV4cG9ydCBlbnVtIEVycm9yIHtcbiAgVmVyc2lvbk5vdFN1cHBvcnQgPSBcIkVSUl9XUk9OR19WRVJTSU9OXCIsXG4gIFR5cGVOb3RTdXBwb3J0ID0gXCJFUlJfVFlQRV9OT1RfU1VQUE9SVEVEXCIsXG4gIEFjdGlvbk5vdFN1cHBvcnQgPSBcIkVSUl9BQ1RJT05fTk9UX1NVUFBPUlRFRFwiLFxuICBVbmtub3duRXJyb3IgPSBcIkVSUl9VTkRFRklORURcIixcbn1cblxuZXhwb3J0IGVudW0gUXJTdGF0dXMge1xuICBQZW5kaW5nLFxuICBTdWNjZXNzLFxuICBGYWlsLFxufVxuXG4vKipcbiAqIE9udGxvZ2luIFFSIHNlcnZlciB1cmxzLlxuICogQGJldGFcbiAqL1xuZXhwb3J0IGVudW0gUmVxdWVzdFVybCB7XG4gIGdldFFSID0gXCJodHRwOi8vMTcyLjE2OC4zLjI0MDozMTg0My9xci1jb2RlL2NoYWxsZW5nZVwiLFxuICBnZXRRUlJlc3VsdCA9IFwiaHR0cDovLzE3Mi4xNjguMy4yNDA6MzE4NDMvcXItY29kZS9yZXN1bHRcIixcbn1cbiIsIi8qKlxuICogUG9zdCByZXF1ZXN0IGluIGpzb24sIGEgc2ltcGxlIHdyYXBwZXIgb2YgZmV0Y2guXG4gKiBAdHlwZVBhcmFtIFQgUmVzcG9uc2UgdHlwZS5cbiAqIEBwYXJhbSB1cmwgUmVxdWVzdCB1cmwuXG4gKiBAcGFyYW0gcGFyYW1zIFJlcXVlc3QgYm9keS5cbiAqIEByZXR1cm4gUHJvbWlzZSByZXNwb25zZS5cbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXMsIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjb25zdCBwb3N0UmVxdWVzdCA9IGFzeW5jIDxUPih1cmw6IHN0cmluZywgYm9keTogYW55KTogUHJvbWlzZTxUPiA9PiB7XG4gIHJldHVybiBmZXRjaCh1cmwsIHtcbiAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICB9LFxuICB9KS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpO1xufTtcblxuLyoqXG4gKiBHZXQgcmVxdWVzdCBpbiBqc29uLCBhIHNpbXBsZSB3cmFwcGVyIG9mIGZldGNoLlxuICogQHR5cGVQYXJhbSBUIFJlc3BvbnNlIHR5cGUuXG4gKiBAcGFyYW0gdXJsIFJlcXVlc3QgdXJsLlxuICogQHBhcmFtIHBhdGggUmVxdWVzdCBwYXRoIGkuZS4gJ2lkJyBvciAnbmV3cy9pZCcuXG4gKiBAcmV0dXJuIFByb21pc2UgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRSZXF1ZXN0ID0gYXN5bmMgPFQ+KHVybDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGZldGNoKGAke3VybH0vJHtwYXRofWApLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSk7XG59O1xuXG4vKipcbiAqIEFzeW5jIHdhaXQgc29tZSB0aW1lLlxuICogQHBhcmFtIHRpbWUgU2Vjb25kIGFtb3VudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdhaXQgPSAodGltZTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0sIHRpbWUpO1xuICB9KTtcbn07XG4iLCJpbXBvcnQge1xuICBBdXRoQ2hhbGxlbmdlLFxuICBBdXRoUmVxdWVzdCxcbiAgQXV0aFJlc3BvbnNlLFxuICBRUlJlc3VsdCxcbiAgU2lnbkRhdGEsXG59IGZyb20gXCIuL3R5cGVcIjtcbmltcG9ydCB7IEFjdGlvbiwgTWVzc2FnZVR5cGUsIFFyU3RhdHVzLCBSZXF1ZXN0VXJsLCBWZXJzaW9uIH0gZnJvbSBcIi4vZW51bVwiO1xuaW1wb3J0IHsgZ2V0UmVxdWVzdCwgcG9zdFJlcXVlc3QsIHdhaXQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9lbnVtXCI7XG5leHBvcnQgeyB3YWl0LCBwb3N0UmVxdWVzdCwgZ2V0UmVxdWVzdCB9O1xuXG4vKipcbiAqIENyZWF0ZSBBdXRoUmVxdWVzdC5cbiAqIEBwYXJhbSBhY3Rpb24gLSBUaGUgYWN0aW9uIHR5cGUuXG4gKiBAcmV0dXJuIFRoZSBBdXRoUmVxdWVzdCBmb3IgZ2V0IEF1dGhDaGFsbGVuZ2UuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNyaXB0XG4gKiBjb25zdCBhdXRoUmVxdWVzdDogQXV0aFJlcXVlc3QgPSBjcmVhdGVBdXRoUmVxdWVzdChBY3Rpb24uSWRBdXRoQW5kVmNBdXRoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlQXV0aFJlcXVlc3QgPSAoXG4gIGFjdGlvbjogQWN0aW9uID0gQWN0aW9uLklkQXV0aFxuKTogQXV0aFJlcXVlc3QgPT4ge1xuICByZXR1cm4ge1xuICAgIHZlcjogVmVyc2lvbi5WZXJzaW9uMSxcbiAgICB0eXBlOiBNZXNzYWdlVHlwZS5DbGllbnRIZWxsbyxcbiAgICBhY3Rpb24sXG4gIH07XG59O1xuXG4vKipcbiAqIEdldCBRUiB3aXRoIHRoZSBBdXRoQ2hhbGxlbmdlIGZyb20gb250b2xvZ2luIFFSIHNlcnZlci5cbiAqIEBwYXJhbSBjaGFsbGVuZ2UgLSBUaGUgQXV0aENoYWxsZW5nZSBmcm9tIHlvdXIgc2VydmVyLlxuICogQHJldHVybiBUZXh0IGZvciBnZW5lcmF0aW5nIHRoZSBRUiBjb2RlIGFuZCBpZCBmb3IgcXVlcnkgc2NhbiByZXN1bHQuXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgeyB0ZXh0LCBpZCB9ID0gYXdhaXQgcmVxdWVzdFFSKGNoYWxsZW5nZSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcXVlc3RRUiA9IGFzeW5jIChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlXG4pOiBQcm9taXNlPFFSUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgcmVzdWx0LCBlcnJvciwgZGVzYyB9ID0gYXdhaXQgcG9zdFJlcXVlc3QoXG4gICAgUmVxdWVzdFVybC5nZXRRUixcbiAgICBjaGFsbGVuZ2VcbiAgKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHJlc3VsdC5pZCxcbiAgICB0ZXh0OiByZXN1bHQucXJDb2RlLFxuICB9O1xufTtcblxuLyoqXG4gKiBRdWVyeSBRUiByZXN1bHQgZnJvbSBvbnRsb2dpbiBRUiBzZXJ2ZXIgdW50aWwgZ2V0IHJlc3VsdCBvciBlcnJvci5cbiAqIEBwYXJhbSBpZCAtIFFSIGlkLlxuICogQHBhcmFtIGR1cmF0aW9uIC0gVGltZSBkdXJhdGlvbihtcykgYmV0d2VlbiBlYWNoIHJlcXVlc3QoMTAwMCBieSBkZWZhdWx0KS5cbiAqIEByZXR1cm4gVGhlIEF1dGhSZXNwb25zZSBmb3Igc3VibWl0IHRvIHNlcnZlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5UVJSZXN1bHQgPSBhc3luYyAoXG4gIGlkOiBzdHJpbmcsXG4gIGR1cmF0aW9uID0gMTAwMFxuKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+ID0+IHtcbiAgY29uc3QgeyByZXN1bHQsIGVycm9yLCBkZXNjIH0gPSBhd2FpdCBnZXRSZXF1ZXN0KFJlcXVlc3RVcmwuZ2V0UVJSZXN1bHQsIGlkKTtcbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGRlc2MpO1xuICB9XG4gIGlmIChyZXN1bHQuc3RhdGUgPT09IFFyU3RhdHVzLlBlbmRpbmcpIHtcbiAgICBhd2FpdCB3YWl0KGR1cmF0aW9uKTtcbiAgICByZXR1cm4gcXVlcnlRUlJlc3VsdChpZCk7XG4gIH1cbiAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gUXJTdGF0dXMuU3VjY2Vzcykge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3VsdC5jbGllbnRSZXNwb25zZSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvcik7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgb2JqZWN0IGZvciB0aGUgd2FsbGV0IHRvIHNpZ24uXG4gKiBAcGFyYW0gY2hhbGxlbmdlIC0gVGhlIEF1dGhDaGFsbGVuZ2UgZnJvbSBzZXJ2ZXIuXG4gKiBAcGFyYW0gYWNjb3VudCAtIFNpZ25lciBkaWQuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWduRGF0YSA9IChcbiAgY2hhbGxlbmdlOiBBdXRoQ2hhbGxlbmdlLFxuICBhY2NvdW50OiBzdHJpbmdcbik6IFNpZ25EYXRhID0+ICh7XG4gIHR5cGU6IFwiQ2xpZW50UmVzcG9uc2VcIixcbiAgc2VydmVyOiB7XG4gICAgbmFtZTogY2hhbGxlbmdlLnNlcnZlci5uYW1lLFxuICAgIHVybDogY2hhbGxlbmdlLnNlcnZlci51cmwsXG4gICAgLi4uKGNoYWxsZW5nZS5zZXJ2ZXIuZGlkID8geyBkaWQ6IGNoYWxsZW5nZS5zZXJ2ZXIuZGlkIH0gOiB7fSksXG4gIH0sXG4gIG5vbmNlOiBjaGFsbGVuZ2Uubm9uY2UsXG4gIGRpZDogYWNjb3VudCxcbiAgY3JlYXRlZDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG59KTtcbiJdLCJuYW1lcyI6WyJWZXJzaW9uIiwiTWVzc2FnZVR5cGUiLCJBY3Rpb24iLCJFcnJvciIsIlFyU3RhdHVzIiwiUmVxdWVzdFVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFZQTtJQUFaLFdBQVksT0FBTztRQUNqQiwyQkFBZ0IsQ0FBQTtJQUNsQixDQUFDLEVBRldBLGVBQU8sS0FBUEEsZUFBTyxRQUVsQjtBQUVXQztJQUFaLFdBQVksV0FBVztRQUNyQiwwQ0FBMkIsQ0FBQTtRQUMzQiwwQ0FBMkIsQ0FBQTtRQUMzQixnREFBaUMsQ0FBQTtJQUNuQyxDQUFDLEVBSldBLG1CQUFXLEtBQVhBLG1CQUFXLFFBSXRCO0lBRUQ7OztBQUdZQztJQUFaLFdBQVksTUFBTTtRQUNoQix1Q0FBVSxDQUFBO1FBQ1YseURBQW1CLENBQUE7SUFDckIsQ0FBQyxFQUhXQSxjQUFNLEtBQU5BLGNBQU0sUUFHakI7QUFFV0M7SUFBWixXQUFZLEtBQUs7UUFDZixnREFBdUMsQ0FBQTtRQUN2QyxrREFBeUMsQ0FBQTtRQUN6QyxzREFBNkMsQ0FBQTtRQUM3Qyx1Q0FBOEIsQ0FBQTtJQUNoQyxDQUFDLEVBTFdBLGFBQUssS0FBTEEsYUFBSyxRQUtoQjtBQUVXQztJQUFaLFdBQVksUUFBUTtRQUNsQiw2Q0FBTyxDQUFBO1FBQ1AsNkNBQU8sQ0FBQTtRQUNQLHVDQUFJLENBQUE7SUFDTixDQUFDLEVBSldBLGdCQUFRLEtBQVJBLGdCQUFRLFFBSW5CO0lBRUQ7Ozs7QUFJWUM7SUFBWixXQUFZLFVBQVU7UUFDcEIsb0VBQXNELENBQUE7UUFDdEQs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
