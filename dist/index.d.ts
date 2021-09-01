import { AuthChallenge, AuthRequest, ChallengeResponse, QrResult, SignData } from "./type";
import { Action } from "./enum";
import { wait, postRequest, getRequest } from "./utils";
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
export declare const createAuthRequest: (action: Action) => AuthRequest;
/**
 * Get QR with AuthChallenge
 * @param challenge - AuthChallenge
 * @returns QR Text and QR id
 * @beta
 */
export declare const requestQR: (challenge: AuthChallenge) => Promise<QrResult>;
/**
 * Query QR result
 * @desc Fetch QR result until get result or error
 * @param id - QR id
 * @param duration - Time duration between each request
 * @returns ChallengeResponse, refer to doc-url-to-ChallengeResponse
 * @beta
 */
export declare const queryQRResult: (id: string, duration?: number) => Promise<ChallengeResponse>;
/**
 * create signData
 * @param challenge - AuthChallenge
 * @param account - signer did
 */
export declare const createSignData: (challenge: AuthChallenge, account: string) => SignData;
