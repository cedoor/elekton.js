import { Contract, ContractFactory, providers } from "ethers"
import { readFileSync } from "fs"
import { join } from "path"
import { connect } from "../src"
import { Ballot } from "../src/Ballot"
import { Elekton } from "../src/Elekton"
import { User } from "../src/User"

export const userPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
]

export function deployElektonContract(): Promise<Contract> {
    const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
    const { abi, bytecode } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))
    const provider = new providers.JsonRpcProvider("http://localhost:8545")
    const signer = provider.getSigner()
    const contractFactory = new ContractFactory(abi, bytecode, signer)

    return contractFactory.deploy()
}

export async function createElektonInstance(contract?: Contract): Promise<Elekton> {
    if (!contract) {
        contract = await deployElektonContract()
    }

    return connect({
        contractAddress: contract.address,
        contractInterface: contract.interface,
        wasmFilePath: join(__dirname, "../../contracts/build/snark/main.wasm"),
        zkeyFilePath: join(__dirname, "../../contracts/build/snark/circuit_final.zkey")
    })
}

export function delay(duration = 5000): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration)
    })
}

export async function getLastBlockTimestamp(provider: providers.Provider): Promise<number> {
    const blockNumber = await provider.getBlockNumber()
    const { timestamp } = await provider.getBlock(blockNumber)

    return timestamp
}

export async function createUsers(elekton: Elekton): Promise<User[]> {
    const users: User[] = []

    for (const userPrivateKey of userPrivateKeys) {
        const user = (await elekton.createUser(userPrivateKey, {
            name: "name",
            surname: "surname"
        })) as User

        users.push(user)
    }

    return users
}

export async function createBallot(users: User[], startDate: number, endDate: number): Promise<Ballot | null> {
    const name = "ballot"
    const description = "This is a ballot description"
    const proposals = ["Yes", "No"]
    const voterPublicKeys = users.map((user) => user.voterPublicKey)

    return users[0].createBallot({
        name,
        description,
        proposals,
        voterPublicKeys,
        startDate,
        endDate
    })
}
