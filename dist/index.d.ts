import { AuthChallenge, AuthRequest, AuthResponse, QRResult, SignData } from "./type";
import { Action } from "./enum";
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
export declare const createAuthRequest: (action?: Action) => AuthRequest;
/**
 * Get QR with the AuthChallenge from ontologin QR server.
 * @param challenge - The AuthChallenge from your server.
 * @param url - Custom request url.
 * @return Text for generating the QR code and id for query scan result.
 * @example
 * ```typescript
 * const { text, id } = await requestQR(challenge);
 * ```
 */
export declare const requestQR: (challenge: AuthChallenge, url?: string | undefined) => Promise<QRResult>;
/**
 * Query QR result from ontlogin QR server until get result or error.
 * @param id - QR id.
 * @param duration - Time duration(ms) between each request(1000 by default).
 * @param url - Custom request url.
 * @return The AuthResponse for submit to server.
 */
export declare const queryQRResult: (id: string, duration?: number, url?: string | undefined) => Promise<AuthResponse>;
/**
 * Stop query QR result
 */
export declare const cancelQueryQRResult: () => void;
/**
 * Create the object for the wallet to sign.
 * @param challenge - The AuthChallenge from server.
 * @param account - Signer did.
 */
export declare const createSignData: (challenge: AuthChallenge, account: string) => SignData;
