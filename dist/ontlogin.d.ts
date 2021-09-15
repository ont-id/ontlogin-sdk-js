declare enum Version {
    Version1 = "1.0"
}
declare enum MessageType {
    ClientHello = "ClientHello",
    ServerHello = "ServerHello",
    ClientResponse = "ClientResponse"
}
/**
 * action enums for createAuthRequest
 */
declare enum Action {
    IdAuth = 0,
    IdAuthAndVcAuth = 1
}
declare enum ErrorEnum {
    VersionNotSupport = "ERR_WRONG_VERSION",
    TypeNotSupport = "ERR_TYPE_NOT_SUPPORTED",
    ActionNotSupport = "ERR_ACTION_NOT_SUPPORTED",
    UnknownError = "ERR_UNDEFINED",
    UserCanceled = "USER_CANCELED"
}
declare enum QrStatus {
    Pending = 0,
    Success = 1,
    Fail = 2
}
/**
 * Ontlogin QR server urls.
 * @beta
 */
declare enum RequestUrl {
    getQR = "http://172.168.3.240:31843/qr-code/challenge",
    getQRResult = "http://172.168.3.240:31843/qr-code/result"
}

/**
 * Authentication request,
 * refer to [Authentication Request](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-request) of the protocol.
 */
interface AuthRequest {
    ver: "1.0";
    type: "ClientHello";
    action: Action;
    ClientChallenge?: Record<string, string | number | boolean>;
}
/**
 * Type of VC required from the server,
 * refer to VCFilters in [Authentication Challenge](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-challenge) of the protocol.
 */
interface VCFilter {
    type: string;
    trustRoot: string[];
    required: boolean;
    express?: string[];
}
/**
 * Authentication challenge,
 * refer to [Authentication Challenge](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-challenge) of the protocol.
 */
interface AuthChallenge {
    ver: Version;
    type: MessageType.ServerHello;
    nonce: string;
    server: {
        name: string;
        icon: string;
        url: string;
        did: string;
        verificationMethod: string;
    };
    chain: string[];
    alg: string[];
    VCFilters: VCFilter[];
}
/**
 * Signed result of the challenge,
 * refer to proof in [Authentication Response](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-response) of the protocol.
 */
interface Proof {
    type: string;
    verificationMethod: string;
    created: string;
    value: string;
}
/**
 * Authentication response,
 * refer to [Authentication Response](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-response) of the protocol.
 */
interface AuthResponse {
    ver: Version;
    type: MessageType.ClientResponse;
    nonce: string;
    did: string;
    proof: Proof;
    VPs: string[];
}
/**
 * QR request result, id: id for query result, text: QR code source text.
 */
interface QRResult {
    id: string;
    text: string;
}
/**
 * Object for the wallet to sign,
 * refer to [Signature (and Authorization)](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#signature-and-authorization) of the protocol.
 */
interface SignData {
    type: "ClientResponse";
    server: {
        name: string;
        url: string;
        did?: string;
    };
    nonce: string;
    did: string;
    created: number;
}

/**
 * Post request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param body Request body.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
declare const postRequest: <T>(url: string, body: any, signal?: AbortSignal | undefined) => Promise<T>;
/**
 * Get request in json, a simple wrapper of fetch.
 * @typeParam T Response type.
 * @param url Request url.
 * @param path Request path i.e. 'id' or 'news/id'.
 * @param signal AbortSignal for cancel request.
 * @return Promise response.
 */
declare const getRequest: <T>(url: string, path: string, signal?: AbortSignal | undefined) => Promise<T>;
/**
 * Async wait some time.
 * @param time Second amount.
 */
declare const wait: (time: number) => Promise<void>;

/**
 * Create AuthRequest.
 * @param action - The action type.
 * @return The AuthRequest for get AuthChallenge.
 * @example
 * ```typescript
 * const authRequest: AuthRequest = createAuthRequest(Action.IdAuthAndVcAuth);
 * ```
 */
declare const createAuthRequest: (action?: Action) => AuthRequest;
/**
 * Get QR with the AuthChallenge from ontologin QR server.
 * @param challenge - The AuthChallenge from your server.
 * @return Text for generating the QR code and id for query scan result.
 * @example
 * ```typescript
 * const { text, id } = await requestQR(challenge);
 * ```
 */
declare const requestQR: (challenge: AuthChallenge) => Promise<QRResult>;
/**
 * Query QR result from ontlogin QR server until get result or error.
 * @param id - QR id.
 * @param duration - Time duration(ms) between each request(1000 by default).
 * @return The AuthResponse for submit to server.
 */
declare const queryQRResult: (id: string, duration?: number) => Promise<AuthResponse>;
/**
 * Stop query QR result
 */
declare const cancelQueryQRResult: () => void;
/**
 * Create the object for the wallet to sign.
 * @param challenge - The AuthChallenge from server.
 * @param account - Signer did.
 */
declare const createSignData: (challenge: AuthChallenge, account: string) => SignData;

export { Action, AuthChallenge, AuthRequest, AuthResponse, ErrorEnum, MessageType, Proof, QRResult, QrStatus, RequestUrl, SignData, VCFilter, Version, cancelQueryQRResult, createAuthRequest, createSignData, getRequest, postRequest, queryQRResult, requestQR, wait };
