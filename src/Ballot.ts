import { BallotInputData } from "./types"
import { User } from "./User"

export class Ballot {
    id?: string // IPFS hash cid.
    votes?: number[]
    decryptionKey?: string

    admin: string // IPFS hash cid.
    name: string
    description: string
    proposals: string[]
    voters: User[]
    startDate: number
    endDate: number

    constructor(ballotData: BallotInputData, admin: string) {
        this.admin = admin
        this.name = ballotData.name
        this.description = ballotData.description
        this.proposals = ballotData.proposals
        this.voters = ballotData.voters
        this.startDate = ballotData.startDate
        this.endDate = ballotData.endDate
    }

    toString(): string {
        return JSON.stringify({
            admin: this.admin,
            name: this.name,
            description: this.description,
            proposals: this.proposals,
            voters: this.voters.map((voter) => voter.id),
            startDate: this.startDate,
            endDate: this.endDate
        })
    }

    // vote(user: User): Promise<void>
    // publishDecryptionKey: Promise<void>
}
