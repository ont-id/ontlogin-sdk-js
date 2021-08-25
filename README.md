# ontlogin-js-sdk

OntLogin SDK for JavaScript provides easy integration for your application to OntLogin.

## Getting Started

### ES Module

1. Install and import package.

*via NPM [package](https://npmjs.com/package/ontlogin-js):*

```
npm i ontlogin-js
```

```js
import {generateAuthData} from "ontlogin-js";
```

*via [js bundle](./dist/ontlogin.min.js):*

```html

<script src="ontlogin.min.js"></script>
<script>
    ontlogin.generateAuthData()
</script>
```

*via [es module js bundle](./dist/ontlogin.es.js):*

```js
import {generateAuthData} from "ontlogin.es.js";
```

2. Generate auth data and request challenge.

```js
import {generateAuthData} from 'ontlogin-js';

const authData = generateAuthData('IdAuth');

// get challenge from your server with authData
```

3. Show QR code and submit response.

```js
import {requestQR, queryQRResult, generateResponse} from 'ontlogin-js';

// get qr text and id
const {text, id} = await requestQR(challenge);
// show qr code
// query scan response
const result = await queryQRResult(id);
// generate auth response
const response = generateResponse(result)
// submit auth response to your server
```

## Example apps

- [vue](./example/vue-demo)
- [pure HTML](./example/html-demo)

## Full Api

*Methods*

- generateAuthData(type) - Get auth data json for request challenge.
  #### Params:

  | Properties | Description                       | Type                                            | Default         |
  | ---------- | --------------------------------- | ----------------------------------------------- | --------------- |
  | type       | Optional.Auth types joined by ',' | string: 'IdAuth' \| 'VcAuth' \| 'IdAuth,VcAuth' | 'IdAuth,VcAuth' |

  #### Return: AuthData

- requestQr(challenge) - Get qr code data from OntLogin qr server.
  #### Params:

  | Properties | Description                                 | Type             | Default |
  | ---------- | ------------------------------------------- | ---------------- | ------- |
  | challenge  | **REQUIRED**.Challenge json given by server | ChallengeMessage |         |

  #### Return: Promise\<QrSource\> - {id, text}

- queryQrResult(id, duration) - Query qr result util get user scan result.
  #### Params:

  | Properties | Description                           | Type   | Default |
  | ---------- | ------------------------------------- | ------ | ------- |
  | id         | **REQUIRED**.Qr id given by requestQr | string |         |
  | duration   | Optional.Time duration of request     | number | 1000    |

  #### Return: Promise\<QrResult\>

- generateResponseData(qrResult) - Get auth response by qr result.
  #### Params:

  | Properties | Description                                   | Type   | Default |
  | ---------- | --------------------------------------------- | ------ | ------- |
  | qrResult   | **REQUIRED**.Qr result given by queryQrResult | string |         |

  #### Return: AuthResponse

*Types*

- AuthData
- Challenge
- QrSource
- QrResult
- AuthResponse
