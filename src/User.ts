import { Contract, Wallet } from "ethers"
import { Ballot } from "./Ballot"
import { BallotInputData, ElektonConfig, UserData } from "./types"
import { createSparseMerkleTree, fromCidToHex } from "./utils"

export class User {
    private config: ElektonConfig
    private contract: Contract
    private ipfs: any

    ipfsCid: string
    privateKey?: string // Ethereum private key.
    voterPrivateKey?: string // EdDSA private key (hexadecimal).

    address: string // Ethereum address.
    voterPublicKey: string // EdDSA public key (hexadecimal).
    name: string
    surname: string

    constructor(userData: UserData) {
        this.contract = userData.contract

        this.ipfs = userData.ipfs
        this.config = userData.config

        this.ipfsCid = userData.ipfsCid
        this.privateKey = userData.privateKey
        this.voterPrivateKey = userData.voterPrivateKey

        this.address = userData.address
        this.voterPublicKey = userData.voterPublicKey
        this.name = userData.name
        this.surname = userData.surname
    }

    async createBallot(ballotInputData: BallotInputData): Promise<Ballot | null> {
        if (!this.privateKey) {
            return null
        }

        const wallet = new Wallet(this.privateKey, this.contract.provider)
        const tree = createSparseMerkleTree(ballotInputData.voterPublicKeys)
        const ballotIpfsData = { ...ballotInputData, adminAddress: this.address }
        const ipfsEntry = await this.ipfs.add(JSON.stringify(ballotIpfsData))
        const ipfsCidHex = fromCidToHex(ipfsEntry.cid)

        try {
            const contract = this.contract.connect(wallet)
            const transaction = await contract.createBallot(
                ipfsCidHex,
                tree.root,
                ballotInputData.startDate,
                ballotInputData.endDate
            )
            const receipt = await transaction.wait()
            const index = receipt.events[0].args._index.toNumber()

            return new Ballot({
                ...ballotIpfsData,
                contract: this.contract,
                config: this.config,
                index,
                ipfsCid: ipfsEntry.cid.toString(),
                votes: []
            })
        } catch (error) {
            return null
        }
    }
}
