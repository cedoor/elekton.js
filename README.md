<p align="center">
    <a href="https://github.com/cedoor/elekton-contracts" target="_blank">
        elekton-contracts
    </a>
    | 
    <a href="https://github.com/cedoor/elekton.js" target="_blank">
        elekton.js
    </a>
    | 
    <a href="https://github.com/cedoor/elekton-dapp" target="_blank">
        elekton-dapp
    </a>
</p>

<p align="center">
    <h1 align="center">
        ElektonJS
    </h1>
    <p align="center">A simple JS library to interact with the Elekton smart contracts and IPFS.</p>
</p>

<p align="center">
    <a href="https://github.com/cedoor/elekton.js" target="_blank">
        <img src="https://img.shields.io/badge/project-Elekton-blue.svg?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/elekton" target="_blank">
        <img alt="NPM version" src="https://img.shields.io/npm/v/elekton?style=flat-square">
    </a>
    <a href="https://github.com/cedoor/elekton.js/blob/master/LICENSE" target="_blank">
        <img alt="Github license" src="https://img.shields.io/github/license/cedoor/elekton.js.svg?style=flat-square">
    </a>
    <a href="https://eslint.org/" target="_blank">
        <img alt="Linter eslint" src="https://img.shields.io/badge/linter-eslint-8080f2?style=flat-square&logo=eslint">
    </a>
    <a href="https://prettier.io/" target="_blank">
        <img alt="Code style prettier" src="https://img.shields.io/badge/code%20style-prettier-f8bc45?style=flat-square&logo=prettier">
    </a>
    <img alt="Repository top language" src="https://img.shields.io/github/languages/top/cedoor/elekton.js?style=flat-square&logo=typescript">
</p>

Elekton is a set of modules useful to create a simple e-voting system that uses non-interactive zero-knowledge proofs and blockchain technologies to allow users to vote anonymously in a verifiable and transparent way. In addition to this repository there are the Elekton [contracts](https://github.com/cedoor/elekton-contracts) and a simple [DApp](https://github.com/cedoor/elekton-dapp), which in turn uses elekton.js and allows you to create users, ballots and to vote anonymously.

**Notice:** The build of this library is a CommonJS module and it has only been used and tested with the [`create-react-app`](https://create-react-app.dev/) scripts, which convert the Node.js modules in order to make the library compatible with browsers.

---

## Table of Contents

-   🛠 [Install](#install)
-   📜 [API reference](#api-reference)
-   🔬 Development
    -   Rules
        -   [Commits](https://github.com/cedoor/cedoor/tree/main/git#commits-rules)
        -   [Branches](https://github.com/cedoor/cedoor/tree/main/git#branch-rules)
-   🧾 [MIT License](https://github.com/cedoor/elekton.js/blob/master/LICENSE)
-   ☎️ [Contacts](#contacts)
    -   [Developers](#developers)

## Install

### npm or yarn

You can install elekton package with npm:

```bash
npm i elekton --save
```

or with yarn:

```bash
yarn add elekton
```


## API reference

-   [Connecting to backend components](#elekton-connect)
-   [Creating users](#elekton-create-user)
-   [Retrieving single users](#elekton-retrieve-user)
-   [Retrieving more users](#elekton-retrieve-users)
-   [Retrieving single ballots](#elekton-retrieve-ballot)
-   [Retrieving more ballots](#elekton-retrieve-ballots)
-   [Creating ballots](#elekton-user-create-ballot)
-   [Voting on ballots](#elekton-ballot-vote)

<a name="elekton-connect" href="#elekton-connect">#</a> **connect**(elektonConfig: [_ElektonConfig_](https://github.com/cedoor/elekton.js/blob/main/src/types/config.ts)): _Elekton_

```typescript
import { connect } from "elekton"
import { abi as contractInterface } from "./contracts/Elekton.json"

const elekton = connect({
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractInterface,
    wasmFilePath: "https://localhost:3000/main.wasm",
    zkeyFilePath: "https://localhost:3000/circuit_final.zkey"
})
```

<a name="elekton-create-user" href="#elekton-create-user">#</a> **elekton.createUser**(userInputData: _UserInputData_): _Promise<User | null>_

```typescript
const user = await elekton.createUser({
    name: "Elon",
    username: "Musk"
})
```

<a name="elekton-retrieve-user" href="#elekton-retrieve-user">#</a> **elekton.retrieveUser**(privateKeyOrAddressOrIpfsCid: _string_): _Promise<User | null>_

```typescript
const user = await elekton.retrieveUser("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
```

<a name="elekton-retrieve-users" href="#elekton-retrieve-users">#</a> **elekton.retrieveUsers**(last: _number_): _Promise<User[]>_

```typescript
const [lastUser] = await elekton.retrieveUsers(1)
```

<a name="elekton-retrieve-ballot" href="#elekton-retrieve-ballot">#</a> **elekton.retrieveBallot**(index: _number_): _Promise\<Ballot>_

```typescript
const ballot = await elekton.retrieveBallot(0)
```

<a name="elekton-retrieve-ballots" href="#elekton-retrieve-ballots">#</a> **elekton.retrieveBallots**(last: _number_): _Promise<Ballot[]>_

```typescript
const [lastBallot] = await elekton.retrieveBallots(1)
```

<a name="elekton-user-create-ballot" href="#elekton-user-create-ballot">#</a> **user.createBallot**(ballotInputData: _BallotInputData_): _Promise<Ballot | null>_

```typescript
const ballot = await user.createBallot({
    name: "County elections",
    description: "Which hobbit do you want to vote for?",
    proposals: ["Frodo Baggins", "Samwise Gamgee", "Pippin Took", "Merry Brandybuck"],
    voterPublicKeys: [
        "0xb5c911b55d3abf84e4cd1309fa8a9ec26a5a079c11935b96af1656fd514eaf02",
        "0x0d5d375a178dad0b3073ff3d5df223c0dc2840e4b417985c87bab671cd50c10d",
        "0xd99c2e06fef7db1dd4b96c3afccd36460bfd37e3bd93b1ad4fe7542f2b0ff090",
        "0xbd43d085e1fcb553d9bce5dd4bb5e399ff4ccbc3d73d89a7826c9f30a6d58915",
        "0x9b2b17399a99664e2f2a0222e3a06ff13ef5cab99324803ad2b1f7124a83a8a4",
        "0x22e6c85ac522f2e2529789e4c80873630472883309b8e6539ed7b3fff1fb4a8a"
    ],
    startDate: 1620038490,
    endDate: 1620138490
})
```

<a name="elekton-ballot-vote" href="#elekton-ballot-vote">#</a> **ballot.vote**(user: _User_, vote: _number_): _Promise<void | null>_

```typescript
await ballot.vote(user, 2)
```

## Contacts

### Developers

-   e-mail : me@cedoor.dev
-   github : [@cedoor](https://github.com/cedoor)
-   website : https://cedoor.dev
