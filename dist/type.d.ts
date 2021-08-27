import { MessageType, Version } from "./enum";
/**
 * Authentication Request
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#send-authentication-request
 */
export interface AuthRequest {
    ver: "1.0";
    type: "ClientHello";
    action: string;
}
/**
 * vc selector in AuthChallenge
 */
export interface VCFilter {
    type: string;
    required: boolean;
    express?: string;
}
/**
 * authentication challenge
 * @desc Refer to https://ontology-1.gitbook.io/ont-login/tutorials/get-started#generate-authentication-challenge
 */
export interface AuthChallenge {
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
    extension?: Record<string, string | number | boolean>;
}
/**
 * Proof
 * @des a signed result of Challenge
 */
export interface Proof {
    type: string;
    verificationMethod: string;
    created: string;
    value: string;
}
/**
 * ChallengeResponse
 * @desc Refer to doc-url-to-ChallengeResponse
 */
export interface ChallengeResponse {
    ver: Version;
    type: MessageType.ClientResponse;
    did: string;
    proof: Proof;
    VPs: string[];
}
export interface QrResult {
    id: string;
    text: string;
}
