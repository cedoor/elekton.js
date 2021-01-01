import { User } from "../User"

export interface UserInputData {
    name: string
    surname: string
}

export interface BallotInputData {
    name: string
    description: string
    proposals: string[]
    voters: User[]
    startDate: number
    endDate: number
}
