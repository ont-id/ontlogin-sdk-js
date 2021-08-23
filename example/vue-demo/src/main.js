import { createApp } from "vue";
import { Buffer } from "buffer";
import App from "./App.vue";

globalThis.Buffer = Buffer;

createApp(App).mount("#app");
