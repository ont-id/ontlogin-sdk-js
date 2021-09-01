export enum Version {
  Version1 = "1.0",
}

export enum MessageType {
  ClientHello = "ClientHello",
  ServerHello = "ServerHello",
  ClientResponse = "ClientResponse",
}

/**
 * action enums for createAuthRequest
 */
export enum Action {
  IdAuth = 0,
  IdAuthAndVcAuth = 1,
}

export enum Error {
  VersionNotSupport = "ERR_WRONG_VERSION",
  TypeNotSupport = "ERR_TYPE_NOT_SUPPORTED",
  ActionNotSupport = "ERR_ACTION_NOT_SUPPORTED",
  UnknownError = "ERR_UNDEFINED",
}

export enum QrStatus {
  Pending,
  Success,
  Fail,
}

export enum RequestUrl {
  getQr = "http://172.168.3.240:31843/qr-code/challenge",
  getQrResult = "http://172.168.3.240:31843/qr-code/result",
}
