import IpfsHttpClient from "ipfs-http-client"
import { eddsa, babyJub } from "circomlib"
import { Contract, Wallet, BigNumber, utils } from "ethers"
import { UserData } from "./types"
import { User } from "./User"

export class Elekton {
    private contract: Contract
    private ipfs: any

    constructor(contract: Contract, ipfs: any) {
        this.contract = contract
        this.ipfs = ipfs
    }

    async createUser(privateKey: string, userData: UserData): Promise<User | null> {
        const wallet = new Wallet(privateKey, this.contract.provider)
        const user = new User(userData)

        const voterPrivateKey = utils.randomBytes(32)
        const voterPublicKey = eddsa.prv2pub(privateKey)

        user.privateKey = privateKey
        user.voterPrivateKey = BigNumber.from(voterPrivateKey).toHexString()
        user.address = wallet.address
        user.voterPublicKey = `0x${babyJub.packPoint(voterPublicKey).toString("hex")}`

        const ipfsEntry = await this.ipfs.add(user.toString())

        try {
            const idNumber = BigNumber.from(ipfsEntry.cid.multihash.slice(2))

            await this.contract.connect(wallet).createUser(idNumber)

            user.id = ipfsEntry.path

            return user
        } catch (error) {
            return null
        }
    }

    async retrieveUser(privateKey: string): Promise<User | null> {
        const wallet = new Wallet(privateKey, this.contract.provider)
        const idNumber = await this.contract.connect(wallet).users(wallet.address)

        if (idNumber.isZero()) {
            return null
        }

        const { multihash, CID } = IpfsHttpClient as any
        const hash = multihash.fromHexString(idNumber.toHexString().slice(2))
        const cid = new CID(new Uint8Array([18, 32, ...hash]))

        const { value } = await this.ipfs.cat(cid).next()

        const userData = JSON.parse(value.toString())
        const user = new User(userData)

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
