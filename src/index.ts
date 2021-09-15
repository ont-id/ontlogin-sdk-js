import {
  AuthChallenge,
  AuthRequest,
  AuthResponse,
  QRResult,
  SignData,
} from "./type";
import {
  Action,
  ErrorEnum,
  MessageType,
  QrStatus,
  RequestUrl,
  Version,
} from "./enum";
import { getRequest, postRequest, wait } from "./utils";

export * from "./type";
export * from "./enum";
export { wait, postRequest, getRequest };

/**
 * Create AuthRequest.
 * @param action - The action type.
 * @return The AuthRequest for get AuthChallenge.
 * @example
 * ```typescript
 * const authRequest: AuthRequest = createAuthRequest(Action.IdAuthAndVcAuth);
 * ```
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
 * Get QR with the AuthChallenge from ontologin QR server.
 * @param challenge - The AuthChallenge from your server.
 * @return Text for generating the QR code and id for query scan result.
 * @example
 * ```typescript
 * const { text, id } = await requestQR(challenge);
 * ```
 */
export const requestQR = async (
  challenge: AuthChallenge
): Promise<QRResult> => {
  const { result, error, desc } = await postRequest(
    RequestUrl.getQR,
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

let isQueryCanceled = false;
let abortController: AbortController | null = null;

/**
 * Query QR result from ontlogin QR server until get result or error.
 * @param id - QR id.
 * @param duration - Time duration(ms) between each request(1000 by default).
 * @return The AuthResponse for submit to server.
 */
export const queryQRResult = async (
  id: string,
  duration = 1000
): Promise<AuthResponse> => {
  if (isQueryCanceled) {
    isQueryCanceled = false;
    abortController = null;
    throw new Error(ErrorEnum.UserCanceled);
  }
  try {
    abortController = new AbortController();
    const { result, error, desc } = await getRequest(
      RequestUrl.getQRResult,
      id,
      abortController.signal
    );
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
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      isQueryCanceled = false;
      abortController = null;
      throw new Error(ErrorEnum.UserCanceled);
    }
    throw err;
  }
};

/**
 * Stop query QR result
 */
export const cancelQueryQRResult = (): void => {
  isQueryCanceled = true;
  abortController?.abort();
};

/**
 * Create the object for the wallet to sign.
 * @param challenge - The AuthChallenge from server.
 * @param account - Signer did.
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
