# ontlogin-sdk-js

OntLogin SDK for JavaScript provides easy integration for your application to OntLogin.

## Getting Started

### ES Module

1. Install and import package.

_via NPM [package](https://npmjs.com/package/ontlogin):_

```
npm i ontlogin
```

```js
import { createAuthRequest } from "ontlogin";
```

_via [js bundle](https://github.com/ontology-tech/ontlogin-sdk-js/blob/main/dist/ontlogin.min.js):_

```html
<script src="ontlogin.min.js"></script>
<script>
  ontlogin.createAuthRequest();
</script>
```

_via [es module js bundle](https://github.com/ontology-tech/ontlogin-sdk-js/blob/main/dist/ontlogin.es.js):_

```js
import { createAuthRequest } from "ontlogin.es.js";
```

2. Generate 'auth request' and get 'challenge' from your server.

```js
import { createAuthRequest } from "ontlogin";

const authRequest = createAuthRequest();
const challenge = await fetch("server-url", { body: authRequest });
```

3. Get QR code from ontlogin QR server.

```js
import { requestQR } from "ontlogin";

const { text, id } = await requestQR(challenge);
```

4. Show QR code ui and query scan result from ontlogin QR server.

```js
const challengeResponse = await queryQRResult(id);
```

5. Submit 'challenge response' to your server.

```js
fetch("server-url", { body: challengeResponse });
```

## Example apps

- [vue](https://github.com/ontology-tech/ontlogin-sdk-js/tree/main/example/vue-demo)
- [pure HTML](https://github.com/ontology-tech/ontlogin-sdk-js/tree/main/example/html-demo)

## npm

publish by yzy123123

## TODO

- [ ] update typescript version
