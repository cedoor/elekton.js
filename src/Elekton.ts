import { Contract } from "ethers"

export class Elekton {
    private contract: Contract
    private ipfs: any

    public ballots: string[]

    constructor(contract: Contract, ipfs: any, ballots: any[]) {
        this.contract = contract
        this.ipfs = ipfs
        this.ballots = ballots
    }

    // createUser(): User {}
    // getUser(): User {}
    // getBallot(): Ballot[] {}
}
