<script setup>
import {
  createAuthRequest,
  postRequest,
  requestQR,
  queryQRResult,
} from "ontlogin";

const showQr = (text) => {
  console.log("show qr code of", text);
}

const login = async () => {
  const authRequest = createAuthRequest(0);
  const authChallenge = await postRequest(
      "server-url/challenge",
      authRequest
  );
  const {text, id} = await requestQR(authChallenge);
  showQr(text);
  const challengeResponse = await queryQRResult(id);
  const result = await postRequest(
      "server-url/response",
      challengeResponse
  );
  console.log(result);
}
</script>

<template>
  <button @click="login">sign in with ONT LOGIN</button>
</template>
