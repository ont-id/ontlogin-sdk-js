import { MessageType, Version, Action } from "./enum";
/**
 * Authentication request,
 * refer to [Authentication Request](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-request) of the protocol.
 */
export interface AuthRequest {
    ver: "1.0";
    type: "ClientHello";
    action: Action;
    ClientChallenge?: Record<string, string | number | boolean>;
}
/**
 * Type of VC required from the server,
 * refer to VCFilters in [Authentication Challenge](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-challenge) of the protocol.
 */
export interface VCFilter {
    type: string;
    trustRoot: string[];
    required: boolean;
    express?: string[];
}
/**
 * Authentication challenge,
 * refer to [Authentication Challenge](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-challenge) of the protocol.
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
}
/**
 * Signed result of the challenge,
 * refer to proof in [Authentication Response](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-response) of the protocol.
 */
export interface Proof {
    type: string;
    verificationMethod: string;
    created: number;
    value: string;
}
/**
 * Authentication response,
 * refer to [Authentication Response](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#authentication-response) of the protocol.
 */
export interface AuthResponse {
    ver: Version;
    type: MessageType.ClientResponse;
    nonce: string;
    did: string;
    proof: Proof;
    VPs: string[];
}
/**
 * QR request result, id: id for query result, text: QR code source text.
 */
export interface QRResult {
    id: string;
    text: string;
}
/**
 * Object for the wallet to sign,
 * refer to [Signature (and Authorization)](https://docs.ont.io/decentralized-identity-and-data/ontid/ont-login/protocol-specification#signature-and-authorization) of the protocol.
 */
export interface SignData {
    type: "ClientResponse";
    server: {
        name: string;
        url: string;
        did?: string;
    };
    nonce: string;
    did: string;
    created: number;
}
