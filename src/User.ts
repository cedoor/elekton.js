import { Contract, Wallet } from "ethers"
import { Ballot } from "./Ballot"
import { Scalar, utils } from "ffjavascript"
import { BallotInputData, ElektonConfig, UserData } from "./types"
import { eddsa, poseidon } from "circomlib"
import createBlakeHash from "blake-hash"
import { createSparseMerkleTree, fromCidToHex, hexToBuffer } from "./utils"

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
                ipfsCid: ipfsEntry.cid.toString()
            })
        } catch (error) {
            return null
        }
    }

    async hasVotedTwice(ballotIndex: number): Promise<boolean | null> {
        if (!this.voterPrivateKey || !this.privateKey) {
            return null
        }

        const blakeHash = createBlakeHash("blake512").update(hexToBuffer(this.voterPrivateKey)).digest()
        const sBuff = eddsa.pruneBuffer(blakeHash.slice(0, 32))
        const s = utils.leBuff2int(sBuff)
        const ppk = Scalar.shr(s, 3)
        const voteNullifier = poseidon([ballotIndex, ppk])
        const wallet = new Wallet(this.privateKey, this.contract.provider)

        return this.contract.connect(wallet).voteNullifier(voteNullifier)
    }
}
