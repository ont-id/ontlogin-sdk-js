<template>
  <button @click="login">sign in with ONT LOGIN</button>
</template>

<script setup>
import {createAuthRequest, queryQRResult, requestQR} from 'ontlogin'
import {client} from "@ont-dev/ontology-dapi";
import {onMounted} from "vue";

onMounted(async () => {
  client.registerClient({
    logMessages: true,
    logWarnings: true,
  });
});

const login = async () => {
  const authRequest = createAuthRequest();
  const challenge = await fetch("http://192.168.0.189:3000/requestChallenge", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authRequest),
  }).then((res) => res.json());
  console.log('Challenge:', challenge);
  const {text, id} = await requestQR(challenge)
  console.log('Show qr:', text)
  const challengeResponse = await queryQRResult(id)
  console.log('Scan success:', challengeResponse)
  const data = await fetch("http://192.168.0.189:3000/submitChallenge", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(challengeResponse),
  }).then((res) => res.json());
  console.log('final', data)
};
</script>
