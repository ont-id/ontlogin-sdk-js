export enum Version {
  Version1 = "1.0",
}

export enum Type {
  ClientHello = "ClientHello",
  ServerHello = "ServerHello",
  ClientResponse = "ClientResponse",
}

export enum Action {
  SignUp = "0",
  SignIn = "1",
  SignInOrSignUp = "2",
}

export enum Error {
  VersionNotSupport = "ERR_WRONG_VERSION",
  TypeNotSupport = "ERR_TYPE_NOT_SUPPORTED",
  ActionNotSupport = "ERR_ACTION_NOT_SUPPORTED",
  UnknownError = "ERR_UNDEFINED",
}

export enum QrStatus {
  Success,
  Pending,
  Fail,
}

export enum RequestUrl {
  getQrText = "",
  getQrResult = "",
}
