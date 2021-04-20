import { User } from "./User"
import { eddsa, poseidon } from "circomlib"
import createBlakeHash from "blake-hash"
import { Scalar, utils } from "ffjavascript"
import { Contract, Wallet } from "ethers"
import { BallotData, ElektonConfig } from "./types"
import { createSparseMerkleTree, unpackVoterPublicKey, hexToBuffer, getProofParameters } from "./utils"

export class Ballot {
    private config: ElektonConfig
    private contract: Contract

    index: number
    ipfsCid: string
    votes: number[]
    decryptionKey?: number

    adminAddress: string // Ethereum address.
    name: string
    description: string
    proposals: string[]
    voterPublicKeys: string[]
    startDate: number
    endDate: number

    constructor(ballotData: BallotData) {
        this.config = ballotData.config
        this.contract = ballotData.contract

        this.index = ballotData.index
        this.ipfsCid = ballotData.ipfsCid
        this.votes = ballotData.votes
        this.decryptionKey = ballotData.decryptionKey

        this.adminAddress = ballotData.adminAddress
        this.name = ballotData.name
        this.description = ballotData.description
        this.proposals = ballotData.proposals
        this.voterPublicKeys = ballotData.voterPublicKeys
        this.startDate = ballotData.startDate
        this.endDate = ballotData.endDate
    }

    async vote(user: User, vote: number): Promise<void | null> {
        if (!user.voterPrivateKey) {
            return null
        }

        const blakeHash = createBlakeHash("blake512").update(hexToBuffer(user.voterPrivateKey)).digest()
        const sBuff = eddsa.pruneBuffer(blakeHash.slice(0, 32))
        const s = utils.leBuff2int(sBuff)
        const ppk = Scalar.shr(s, 3)

        const signature = eddsa.signPoseidon(hexToBuffer(user.voterPrivateKey), BigInt(vote))
        const voteNullifier = poseidon([this.index, ppk])

        const tree = createSparseMerkleTree(this.voterPublicKeys)
        const { sidenodes } = tree.createProof(unpackVoterPublicKey(user.voterPublicKey)[0])

        while (sidenodes.length < 10) {
            sidenodes.push(BigInt(0))
        }

        const proofParameters = await getProofParameters(
            {
                privateKey: ppk,
                R8x: signature.R8[0],
                R8y: signature.R8[1],
                S: signature.S,
                smtSiblings: sidenodes,
                smtRoot: tree.root,
                vote: BigInt(vote),
                ballotIndex: this.index,
                voteNullifier
            },
            this.config.wasmFilePath,
            this.config.zkeyFilePath
        )
        const wallet = new Wallet(user.privateKey as string, this.contract.provider)
        const contract = this.contract.connect(wallet)
        const transaction = await contract.vote(...proofParameters)

        await transaction.wait()

        this.votes.push(vote)
    }

    async publishDecryptionKey(user: User, decryptionKey: number): Promise<void> {
        const wallet = new Wallet(user.privateKey as string, this.contract.provider)
        const tx = await this.contract.connect(wallet).publishDecryptionKey(this.index, decryptionKey)

        await tx.wait()

        this.decryptionKey = decryptionKey
    }
}
