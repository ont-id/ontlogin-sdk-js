import { Action, Type, Version } from "./enum";

export interface BaseMessage {
  ver: Version;
  type: Type;
}

export interface SignInMessage extends BaseMessage {
  type: Type.ClientHello;
  name?: string;
  action: Action.SignIn;
}

export interface SignUpMessage extends BaseMessage {
  type: Type.ClientHello;
  name?: string;
  action: Action.SignUp;
}

export interface SignInOrSignUpMessage extends BaseMessage {
  type: Type.ClientHello;
  name?: string;
  action: Action.SignInOrSignUp;
}

/**
 * vc selector
 */
export interface VCFilter {
  type: string;
  required: boolean;
  express?: string;
}

/**
 * challenge infos from server to client
 */
export interface ChallengeMessage extends BaseMessage {
  type: Type.ServerHello;
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
 * Proof infos from client to server
 */
export interface ProofMessage extends BaseMessage {
  type: Type.ClientResponse;
  did: string;
  proof: Proof;
  VPs: string[];
}

export interface QrResult {
  id: string;
  qrText: string;
}

export interface SignData {
  type: "ClientResponse";
  server: {
    name?: string;
    url: string;
    did: string;
  };
  nonce: string;
  did: string;
  created: string; // timestamp
}
