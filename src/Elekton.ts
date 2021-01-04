import { babyJub, eddsa } from "circomlib"
import { BigNumber, Contract, providers, utils, VoidSigner, Wallet } from "ethers"
import IpfsHttpClient from "ipfs-http-client"
import { ElektonConfig, UserInputData } from "./types"
import { User } from "./User"

export class Elekton {
    private contract: Contract
    private ipfs: any

    constructor(elektonConfig: ElektonConfig) {
        const provider = new providers.JsonRpcProvider(elektonConfig.ethereumProvider || "http://localhost:8545")

        this.contract = new Contract(elektonConfig.contractAddress, elektonConfig.contractInterface, provider)
        this.ipfs = IpfsHttpClient({ url: elektonConfig.ipfsProvider || "http://localhost:5001" })
    }

    async createUser(privateKey: string, userInputData: UserInputData): Promise<User | null> {
        const wallet = new Wallet(privateKey, this.contract.provider)

        const voterPrivateKey = utils.randomBytes(32)
        const voterPublicKey = `0x${babyJub.packPoint(eddsa.prv2pub(privateKey)).toString("hex")}`

        const user = new User({ ...userInputData, address: wallet.address, voterPublicKey }, this.contract, this.ipfs)

        const ipfsEntry = await this.ipfs.add(user.toString())

        try {
            const idNumber = BigNumber.from(ipfsEntry.cid.multihash.slice(2))

            await this.contract.connect(wallet).createUser(idNumber)

            user.id = ipfsEntry.path
            user.privateKey = privateKey
            user.voterPrivateKey = BigNumber.from(voterPrivateKey).toHexString()

            return user
        } catch (error) {
            return null
        }
    }

    async retrieveUser(privateKeyOrAddress: string): Promise<User | null> {
        let idNumber, privateKey

        if (utils.isAddress(privateKeyOrAddress)) {
            const voidSigner = new VoidSigner(privateKeyOrAddress, this.contract.provider)
            idNumber = await this.contract.connect(voidSigner).users(privateKeyOrAddress)
        } else {
            const wallet = new Wallet(privateKeyOrAddress, this.contract.provider)
            idNumber = await this.contract.connect(wallet).users(wallet.address)
            privateKey = privateKeyOrAddress
        }

        if (idNumber.isZero()) {
            return null
        }

        const { multihash, CID } = IpfsHttpClient as any
        const hash = multihash.fromHexString(idNumber.toHexString().slice(2))
        const cid = new CID(new Uint8Array([18, 32, ...hash]))

        const { value } = await this.ipfs.cat(cid).next()

        const userData = JSON.parse(value.toString())
        const user = new User(userData, this.contract, this.ipfs)

        user.id = cid.toString()
        user.privateKey = privateKey

        return user
    }

    // async getBallots(last = 1): Promise<any | any[]> {
    // const filter = this.contract.filters.BallotCreated()
    // const ballots = await this.contract.queryFilter(filter)

    // if (last === 1) {
    // return ballots[0]
    // }

    // return ballots.slice(0, last)
    // }
}
