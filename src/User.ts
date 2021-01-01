import { BallotInputData, UserInputData } from "./types"
import { babyJub, smt } from "circomlib"
import { Ballot } from "./Ballot"
import { BigNumber, Contract, Wallet } from "ethers"

export class User {
    private contract: Contract
    private ipfs: any

    id?: number // IPFS hash.
    privateKey?: string // Ethereum private key.
    voterPrivateKey?: string // EdDSA private key (hexadecimal).
    address?: string // Ethereum address.
    voterPublicKey?: string // EdDSA public key (hexadecimal).

    name: string
    surname: string

    constructor(userInputData: UserInputData, contract: Contract, ipfs: any) {
        this.contract = contract
        this.ipfs = ipfs
        this.name = userInputData.name
        this.surname = userInputData.surname
    }

    async createBallot(ballotInputData: BallotInputData): Promise<Ballot | null> {
        if (!this.privateKey) {
            return null
        }

        const ballot = new Ballot(ballotInputData, this)
        const tree = await smt.newMemEmptyTrie()

        for (const voter of ballotInputData.voters) {
            const hexDigits = voter.voterPublicKey?.slice(2)?.match(/[\da-f]{2}/gi) as RegExpMatchArray
            const typedArray = new Uint8Array(hexDigits.map((h) => parseInt(h, 16)))
            const voterPublicKeyPoint = babyJub.unpackPoint(typedArray.buffer)

            await tree.insert(...voterPublicKeyPoint)
        }

        const ipfsEntry = await this.ipfs.add(ballot.toString())

        try {
            const idNumber = BigNumber.from(ipfsEntry.cid.multihash.slice(2))
            const wallet = new Wallet(this.privateKey, this.contract.provider)

            await this.contract.connect(wallet).createBallot(idNumber, tree.root, ballot.startDate, ballot.endDate)

            ballot.id = ipfsEntry.path

            return ballot
        } catch (error) {
            console.log(error)
            return null
        }
    }

    toString(): string {
        return JSON.stringify({
            address: this.address,
            voterPublicKey: this.voterPublicKey,
            name: this.name,
            surname: this.surname
        })
    }
}
