import IpfsHttpClient from "ipfs-http-client"
import { Contract, Wallet, BigNumber } from "ethers"
import { UserData } from "./types"
import { User } from "./User"
import { getErrorMessage } from "./utils"

export class Elekton {
    private contract: Contract
    private ipfs: any

    constructor(contract: Contract, ipfs: any) {
        this.contract = contract
        this.ipfs = ipfs
    }

    async createUser(privateKey: string, userData: UserData): Promise<User> {
        const wallet = new Wallet(privateKey, this.contract.provider)
        const user = new User(userData.name, userData.surname)

        const ipfsEntry = await this.ipfs.add(user.toString())

        try {
            const idNumber = BigNumber.from(ipfsEntry.cid.multihash.slice(2))

            await this.contract.connect(wallet).createUser(idNumber)

            user.id = ipfsEntry.path
            user.address = wallet.address

            return user
        } catch (error) {
            const message = getErrorMessage(error)

            if (message.includes("E001")) {
                throw Error("User data already exists")
            } else {
                throw error
            }
        }
    }

    async retrieveUser(privateKey: string): Promise<User> {
        const wallet = new Wallet(privateKey, this.contract.provider)
        const idNumber = await this.contract.connect(wallet).users(wallet.address)

        const { multihash, CID } = IpfsHttpClient as any
        const hash = multihash.fromHexString(idNumber.toHexString().slice(2))
        const cid = new CID(new Uint8Array([18, 32, ...hash]))

        const { value } = await this.ipfs.cat(cid).next()

        const userData = JSON.parse(value.toString())
        const user = new User(userData.name, userData.surname)

        user.id = cid.toString()
        user.address = wallet.address

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
