import {
  AuthChallenge,
  AuthRequest,
  ChallengeResponse,
  QrResult,
  SignData,
} from "./type";
import { Action, MessageType, QrStatus, RequestUrl, Version } from "./enum";
import { getRequest, postRequest, wait } from "./utils";

export * from "./type";
export * from "./enum";
export { wait, postRequest, getRequest };

/**
 * Create AuthRequest
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#send-authentication-request
 * @param action - Action 0-IdAuth 1-IdAuth and VcAuth
 * @returns AuthRequest
 * @beta
 */
export const createAuthRequest = (
  action: Action = Action.IdAuth
): AuthRequest => {
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
export const requestQR = async (
  challenge: AuthChallenge
): Promise<QrResult> => {
  const { result, error, desc } = await postRequest(
    RequestUrl.getQr,
    challenge
  );
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
export const queryQRResult = async (
  id: string,
  duration = 1000
): Promise<ChallengeResponse> => {
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
export const createSignData = (
  challenge: AuthChallenge,
  account: string
): SignData => ({
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
