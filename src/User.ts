import { Contract, VoidSigner, Wallet } from "ethers"
import { Ballot } from "./Ballot"
import { BallotInputData, BallotIpfsData, ElektonConfig, UserData, UserIpfsData } from "./types"
import { createSparseMerkleTree, fromCidToHex, fromHexToCid } from "./utils"

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

        const tree = await createSparseMerkleTree(ballotInputData.voterPublicKeys)

        // Add ballot data to IPFS.
        const ballotIpfsData = { ...ballotInputData, adminAddress: this.address }
        const ipfsEntry = await this.ipfs.add(Ballot.dataToString(ballotIpfsData))
        const ipfsCidHex = fromCidToHex(ipfsEntry.cid)

        try {
            const tx = await this.contract
                .connect(wallet)
                .createBallot(ipfsCidHex, tree.root, ballotInputData.startDate, ballotInputData.endDate)

            const txReceipt = await tx.wait()
            const index = txReceipt.events[0].args._index.toString()

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

    async retrieveBallot(index: number): Promise<Ballot | null> {
        const voidSigner = new VoidSigner(this.address, this.contract.provider)
        const contractBallot = await this.contract.connect(voidSigner).ballots(index)

        const ipfsCid = fromHexToCid(contractBallot.data)
        const { value } = await this.ipfs.cat(ipfsCid).next()
        const ballotIpfsData = JSON.parse(value.toString()) as BallotIpfsData

        return new Ballot({
            ...ballotIpfsData,
            contract: this.contract,
            config: this.config,
            index,
            ipfsCid,
            votes: contractBallot.votes || [],
            decryptionKey: contractBallot.decryptionKey
        })
    }

    static dataToString(userIpfsData: UserIpfsData): string {
        return JSON.stringify(userIpfsData)
    }
}
