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
import {createAuthRequest} from "ontlogin";
```

_via [js bundle](./dist/ontlogin.min.js):_

```html

<script src="ontlogin.min.js"></script>
<script>
    ontlogin.createAuthRequest();
</script>
```

_via [es module js bundle](./dist/ontlogin.es.js):_

```js
import {createAuthRequest} from "ontlogin.es.js";
```

2. Generate auth data and request challenge.

```js
import {createAuthRequest} from "ontlogin";

const authRequest = createAuthRequest();

// get challenge from your server with authRequest
```

3. Show QR code and then submit response.

```js
import {requestQR, queryQRResult} from "ontlogin";

// get qr text and id
const {text, id} = await requestQR(challenge);
// show qr code
// query scan response
const challengeResponse = await queryQRResult(id);
// submit challengeResponse to your server
```

## Example apps

- [vue](./example/vue-demo)
- [pure HTML](./example/html-demo)

## npm

publish by yzy123123

## TODO

- [ ] update typescript version
