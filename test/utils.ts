import { Contract, ContractFactory, providers, Wallet } from "ethers"
import { readFileSync } from "fs"
import { join } from "path"
import { connect } from "../src"
import { Ballot } from "../src/Ballot"
import { Elekton } from "../src/Elekton"
import { User } from "../src/User"

export function deployElektonContract(): Promise<Contract> {
    const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
    const { abi, bytecode } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))
    const provider = new providers.JsonRpcProvider("http://localhost:8545")
    const wallet = Wallet.createRandom().connect(provider)
    const contractFactory = new ContractFactory(abi, bytecode, wallet)

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

export async function createUsers(elekton: Elekton, n = 4): Promise<User[]> {
    const users: User[] = []

    for (let i = 0; i < n; i++) {
        const user = (await elekton.createUser({
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
