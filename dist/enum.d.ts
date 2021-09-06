export declare enum Version {
    Version1 = "1.0"
}
export declare enum MessageType {
    ClientHello = "ClientHello",
    ServerHello = "ServerHello",
    ClientResponse = "ClientResponse"
}
/**
 * action enums for createAuthRequest
 */
export declare enum Action {
    IdAuth = 0,
    IdAuthAndVcAuth = 1
}
export declare enum Error {
    VersionNotSupport = "ERR_WRONG_VERSION",
    TypeNotSupport = "ERR_TYPE_NOT_SUPPORTED",
    ActionNotSupport = "ERR_ACTION_NOT_SUPPORTED",
    UnknownError = "ERR_UNDEFINED"
}
export declare enum QrStatus {
    Pending = 0,
    Success = 1,
    Fail = 2
}
/**
 * Ontlogin QR server urls.
 * @beta
 */
export declare enum RequestUrl {
    getQR = "http://172.168.3.240:31843/qr-code/challenge",
    getQRResult = "http://172.168.3.240:31843/qr-code/result"
}
