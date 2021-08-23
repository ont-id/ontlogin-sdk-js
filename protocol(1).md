## 协议

### 认证请求

客户端向用户端发送认证请求，请求数据格式如下：

* 协议版本号
* 消息类型
* （可选的）用户名
 * 动作类型
* （可选的）客户端挑战

```json
{
 "ver": "1.0",
 "type": "ClientHello",
 "name": "alice",
 "action": "1",
 "ClientChanllege"：{},
}
```

ver为协议版本号，目前协议版本号定为1.0；

type为消息类型，认证请求为消息类型为“ClientHello”；

name为客户端提供的用户名；

action描述用户行为，为非负整数，0代表注册，1代表认证；

ClientChanllege在双向认证时使用，暂未定义；



### 认证挑战

在收到客户端的请求后，服务端先验证是否支持该链上的did，根据reg类型取得不同的VCFilters。

服务端生成nonce，存储nonce和请求中的uuid。

以下情况返回错误：
- ERR_WRONG_VERSION: 版本号不支持
- ERR_TYPE_NOT_SUPPORTED: 消息类型错误
- ERR_CHAIN_NOT_SUPPORTED：不支持的链
- ERR_CLIENT_UUID_NOT_GENERATED: id字段为非128位uuid
- ERR_ACTION_NOT_SUPPORTED: 操作行为不支持
- ERR_UNDEFINED: 其它未定义错误

服务端返回下列信息给客户端。

* 协议版本号
* 消息类型

* 随机挑战
* 服务器信息（包括name，icon，url，did， verificationMethod）
* 所需凭证要求
* 支持的签名算法
* （可选的）客户端挑战

```json
{
 "ver": "1.0",
 "type": "ServerHello",
 "nonce": "128-uuid",
 "server": {
   "name": "",
   "icon": "",
   "url": "",
   "did": "",
   "verificationMethod": "",
 },
 "chain": ["ONT","BSC"],
 "alg": ["ES256","Ed25519"],
 "VCFilters": [
   {type: "DegreeCredential", required: true},
   {type: "IdentityCredential", express:"", required: false},
 ],
 "ServerProof"：{},
 "extension": {},
}
```

type为消息类型，认证挑战为消息类型为“ServerHello”

nonce为随机挑战，是128位的uuid

server为服务器信息，其中name和url为必填字段，did和verificationMethod在双向认证时必填

VCFilters为服务器所需客户端凭证出示的类型

chain为服务端支持的链

alg为服务端对客户端签名响应的算法支持

ServerProof为双向认证时服务器对客户端挑战的响应

### 认证响应

收到认证挑战后，客户端进行响应。

* 协议版本号
* 消息类型
* 用户did
* 用户对服务器挑战对响应
* （服务器需要的）Verifiable Presentation

```json
{
 "ver": "1.0",
 "type": "ClientResponse",
 "did": "did:ont:alice",
 "proof": {
   "type":"Ed25519",
   "verificationMethod": "did:ont:alice#key-1",
   "created":"2010-01-0119:23:24Z",
   "value":"xx"
 },
 "VPs": ["",""],
}
```

type为消息类型，认证挑战为消息类型为“ClientResponse”

did为客户端用户的DID

proof为客户端对服务器端对响应，包括
- type为签名算法
- verificationMethod为用户did中验证方法的序列号
- created为时间戳
- value为用户签名值。用户对消息类型，认证挑战中的server信息，nonce值，以及用户did，created进行序列化得到消息，并对该消息进行签名。

待签名消息：
```json
{
  "type": "ClientResponse",
  "server": {
	"name":
	"url":
	"did":
  },
  "nonce": "128-uuid",
  "did": "did:ont:alice",
  "created":"2010-01-0119:23:24Z",
}
```

### 认证结果

检查挑战响应是否正确；
- 检查消息类型是否匹配
- 检查Server类型是否匹配
- 选取存储的nonce值计算验证签名结果

检查VP是否满足要求，VP是否正确。

如果是非注册类型操作，将检查该DID是否已经注册为服务端用户。



ONT Login是去中心化通用认证登录组件，帮助开发者屏蔽认证细节，可以为企业快速带来Web 3.0的安全登录体验。

登录时同步授权：基于去中心化标识和可验证凭证技术，帮助用户快速登录的同时，向服务端授权必要信息。

一次验证，多次使用：用户在去中心化身份钱包中可以进行邮箱，电话号码等验证，获得相关凭证。在向不同服务方登录时，可以直接出示相关凭证，免去多次验证的繁琐。

快速安全：采用挑战-响应的认证模式，利用数字签名技术，带来
