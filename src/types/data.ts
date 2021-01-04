import { User } from "../User"

export interface UserInputData {
    name: string
    surname: string
}

export interface UserData extends UserInputData {
    address: string
    voterPublicKey: string
}

export interface BallotInputData {
    name: string
    description: string
    proposals: string[]
    voters: User[]
    startDate: number
    endDate: number
}

export interface BallotData extends BallotInputData {
    admin: string
}
