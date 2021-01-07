import { babyJub, eddsa } from "circomlib"
import { BigNumber, Contract, providers, utils, VoidSigner, Wallet, constants } from "ethers"
import IpfsHttpClient from "ipfs-http-client"
import { ElektonConfig, UserInputData, UserIpfsData } from "./types"
import { User } from "./User"
import { fromCidToHex, fromHexToCid } from "./utils"

export class Elekton {
    private config: ElektonConfig
    private contract: Contract
    private ipfs: any

    constructor(elektonConfig: ElektonConfig) {
        const provider = new providers.JsonRpcProvider(elektonConfig.ethereumProvider || "http://localhost:8545")

        this.config = elektonConfig
        this.contract = new Contract(elektonConfig.contractAddress, elektonConfig.contractInterface, provider)
        this.ipfs = IpfsHttpClient({ url: elektonConfig.ipfsProvider || "http://localhost:5001" })
    }

    async createUser(privateKey: string, userInputData: UserInputData): Promise<User | null> {
        const wallet = new Wallet(privateKey, this.contract.provider)

        const voterPrivateKeyBuffer = Buffer.from(utils.randomBytes(32))
        const voterPublicKey = `0x${babyJub.packPoint(eddsa.prv2pub(voterPrivateKeyBuffer)).toString("hex")}`

        // Add user data to IPFS.
        const userIpfsData = { ...userInputData, address: wallet.address, voterPublicKey }
        const ipfsEntry = await this.ipfs.add(User.dataToString(userIpfsData))
        const ipfsCidHex = fromCidToHex(ipfsEntry.cid)

        try {
            await this.contract.connect(wallet).createUser(ipfsCidHex)

            return new User({
                ...userIpfsData,
                contract: this.contract,
                ipfs: this.ipfs,
                config: this.config,
                ipfsCid: ipfsEntry.cid.toString(),
                privateKey,
                voterPrivateKey: BigNumber.from(voterPrivateKeyBuffer).toHexString()
            })
        } catch (error) {
            return null
        }
    }

    async retrieveUser(privateKeyOrAddressOrIpfsCid: string): Promise<User | null> {
        const { CID } = IpfsHttpClient as any
        let ipfsCid, privateKey

        if (CID.isCID(privateKeyOrAddressOrIpfsCid)) {
            ipfsCid = privateKeyOrAddressOrIpfsCid
        } else {
            try {
                let ipfsCidHex: string

                if (utils.isAddress(privateKeyOrAddressOrIpfsCid)) {
                    const voidSigner = new VoidSigner(privateKeyOrAddressOrIpfsCid, this.contract.provider)

                    ipfsCidHex = await this.contract.connect(voidSigner).users(privateKeyOrAddressOrIpfsCid)
                } else {
                    const wallet = new Wallet(privateKeyOrAddressOrIpfsCid, this.contract.provider)

                    ipfsCidHex = await this.contract.connect(wallet).users(wallet.address)
                    privateKey = privateKeyOrAddressOrIpfsCid
                }

                if (ipfsCidHex === constants.HashZero) {
                    return null
                }

                ipfsCid = fromHexToCid(ipfsCidHex)
            } catch (error) {
                return null
            }
        }

        const { value } = await this.ipfs.cat(ipfsCid).next()
        const userIpfsData: UserIpfsData = JSON.parse(value.toString())

        return new User({
            ...userIpfsData,
            contract: this.contract,
            ipfs: this.ipfs,
            config: this.config,
            ipfsCid,
            privateKey
        })
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
