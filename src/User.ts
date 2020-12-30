export class User {
    id?: number // IPFS hash.
    address?: string // Ethereum address.

    name: string
    surname: string

    constructor(name: string, surname: string) {
        this.name = name
        this.surname = surname
    }

    toString(): string {
        return JSON.stringify({
            name: this.name,
            surname: this.surname
        })
    }

    // createBallot(): Promise<Ballot>
}
