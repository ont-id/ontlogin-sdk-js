import {
  AuthChallenge,
  AuthRequest,
  ChallengeResponse,
  QrResult,
} from "./type";
import { Action, MessageType, QrStatus, RequestUrl, Version } from "./enum";
import { wait, postRequest, getRequest } from "./utils";

export { wait, postRequest, getRequest } from "./utils";
export * from "./type";
export * from "./enum";

/**
 * Create AuthRequest
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#send-authentication-request
 * @param actions - support actions(e.g., ['authorization']), empty by default
 * @returns AuthRequest
 * @beta
 */
export const createAuthRequest = (actions: Action[] = []): AuthRequest => {
  return {
    ver: Version.Version1,
    type: MessageType.ClientHello,
    action: actions.includes(Action.Authorization) ? "1" : "0", // todo confirm action
  };
};

/**
 * Get QR with AuthChallenge
 * @desc Refer to url-to-scan-server-doc
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
