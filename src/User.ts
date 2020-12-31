import { UserData } from "./types"

export class User {
    id?: number // IPFS hash.
    privateKey?: string // Ethereum private key.
    voterPrivateKey?: string // EdDSA private key (hexadecimal).

    address?: string // Ethereum address.
    voterPublicKey?: string // EdDSA public key (hexadecimal).
    name: string
    surname: string

    constructor(userData: UserData) {
        this.name = userData.name
        this.surname = userData.surname
    }

    toString(): string {
        return JSON.stringify({
            address: this.address,
            voterPublicKey: this.voterPublicKey,
            name: this.name,
            surname: this.surname
        })
    }

    // createBallot(): Promise<Ballot> {

    // }
}
