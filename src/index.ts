import {
  ChallengeMessage,
  ProofMessage,
  QrResult,
  SignData,
  SignInMessage,
  SignInOrSignUpMessage,
  SignUpMessage,
} from "./type";
import { Action, QrStatus, RequestUrl, Type, Version } from "./enum";
import { wait, postRequest } from "./utils";

export { wait, postRequest } from "./utils";

/**
 * 构造登录消息体
 */
export const buildSignInMessage = (name?: string): SignInMessage => ({
  ver: Version.Version1,
  type: Type.ClientHello,
  name,
  action: Action.SignIn,
});

/**
 * 构造注册消息体
 */
export const buildSignUpMessage = (name?: string): SignUpMessage => ({
  ver: Version.Version1,
  type: Type.ClientHello,
  name,
  action: Action.SignUp,
});

/**
 * 构造注册登录通用消息体
 */
export const buildSignInOrSignUpMessage = (
  name?: string
): SignInOrSignUpMessage => {
  return {
    ver: Version.Version1,
    type: Type.ClientHello,
    name,
    action: Action.SignInOrSignUp,
  };
};

/**
 * 获取二维码数据`
 * @desc 后台基于ChallengeMessage和扫码服务器信息格式化，返回url和扫码id
 */
export const fetchQrText = async (
  challenge: ChallengeMessage
): Promise<QrResult> => {
  return postRequest<QrResult>(RequestUrl.getQrText, challenge);
};

/**
 * 轮循扫码结果
 */
export const queryQrResult = async (
  id: string,
  duration = 1000
): Promise<ProofMessage> => {
  const { status, result, error } = await postRequest(RequestUrl.getQrResult, {
    id,
  });
  if (status === QrStatus.Pending) {
    await wait(duration);
    return queryQrResult(id);
  }
  if (status === QrStatus.Success) {
    return result;
  }
  throw new Error(error);
};

export const buildSignData = (
  challenge: ChallengeMessage,
  did: string,
  time: string
): SignData => {
  return {
    type: "ClientResponse",
    server: {
      name: challenge.server.name,
      url: challenge.server.url,
      did: challenge.server.did,
    },
    nonce: challenge.nonce,
    did,
    created: time,
  };
};
