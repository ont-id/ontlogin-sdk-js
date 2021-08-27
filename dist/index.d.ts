import { AuthChallenge, AuthRequest, ChallengeResponse, QrResult } from "./type";
import { Action } from "./enum";
export * from "./type";
export * from "./enum";
/**
 * Create AuthRequest
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#send-authentication-request
 * @param actions - support actions(e.g., ['authorization']), empty by default
 * @returns AuthRequest
 * @beta
 */
export declare const createAuthRequest: (actions?: Action[]) => AuthRequest;
/**
 * Get QR with AuthChallenge
 * @desc Refer to url-to-scan-server-doc
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
