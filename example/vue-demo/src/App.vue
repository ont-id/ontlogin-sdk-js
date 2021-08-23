<template>
  <button @click="login">sign in with ONT LOGIN</button>
</template>

<script setup>
import { buildSignInMessage, buildSignData } from "../../../dist/ontlogin.es";
import { client } from "@ont-dev/ontology-dapi";
import { onMounted } from "@vue/runtime-core";

onMounted(async () => {
  client.registerClient({
    logMessages: true,
    logWarnings: true,
  });
});

const login = async () => {
  // 生成认证请求对象
  const signInMessage = buildSignInMessage();
  // 请求认证挑战
  const challenge = await fetch("http://192.168.0.189:3000/requestChallenge", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signInMessage),
  }).then((res) => res.json());
  console.log(challenge);
  const now = String(Date.now());
  const did = await client.api.identity.getIdentity();
  // 生成待签名的对象
  const signData = buildSignData(challenge, did, now);
  console.log("生成待签名的对象", signData, JSON.stringify(signData));
  const { data } = await client.api.message.signMessage({
    message: JSON.stringify(signData),
    useIdentity: true,
  });
  const poofMessage = {
    ver: "1.0",
    type: "ClientResponse",
    did: did,
    nonce: signData.nonce,
    proof: {
      type: challenge.alg[0],
      verificationMethod: `${did}#key-1`,
      created: now,
      value: data,
    },
    // VPs: ["", ""],
  };
  // 提交签名结果
  console.log("提交签名结果", poofMessage, JSON.stringify(poofMessage));
  fetch("https://192.168.0.189:3000/submitChallenge", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(poofMessage),
  });
  console.log(data);
};
</script>
