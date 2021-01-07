import { Contract } from "ethers"
import { ElektonConfig } from "."

export interface UserInputData {
    name: string
    surname: string
}

export interface UserIpfsData extends UserInputData {
    address: string
    voterPublicKey: string
}

export interface UserData extends UserIpfsData {
    config: ElektonConfig
    contract: Contract
    ipfs: any
    ipfsCid: string
    privateKey?: string
    voterPrivateKey?: string
}

export interface BallotInputData {
    name: string
    description: string
    proposals: string[]
    voterPublicKeys: string[]
    startDate: number
    endDate: number
}

export interface BallotIpfsData extends BallotInputData {
    adminAddress: string
}

export interface BallotData extends BallotIpfsData {
    config: ElektonConfig
    contract: Contract
    index: number
    ipfsCid: string
    votes: number[]
    decryptionKey?: string
}
