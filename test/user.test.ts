import { Elekton } from "../src/Elekton"
import { User } from "../src/User"
import { Ballot } from "../src/Ballot"
import { createElektonInstance, createUsers, deployElektonContract, getLastBlockTimestamp } from "./utils"
import { Contract } from "ethers"

describe("User", () => {
    let contract: Contract
    let elekton: Elekton
    let users: User[]
    let ballot: Ballot

    beforeAll(async () => {
        contract = await deployElektonContract()
        elekton = await createElektonInstance()
        users = await createUsers(elekton)
    })

    describe("Create a ballot", () => {
        it("Should create a ballot", async () => {
            const timestamp = await getLastBlockTimestamp(contract.provider)
            const name = "ballot"
            const description = "This is a ballot description"
            const proposals = ["Yes", "No"]
            const voterPublicKeys = users.map((user) => user.voterPublicKey)
            const startDate = timestamp + 2
            const endDate = timestamp + 70

            ballot = (await users[0].createBallot({
                name,
                description,
                proposals,
                voterPublicKeys,
                startDate,
                endDate
            })) as Ballot

            expect(ballot).toBeInstanceOf(Ballot)
            expect(ballot.ipfsCid).not.toBeNull()
        })
    })

    describe("Check user vote", () => {
        it("Should check if a user has voted twice and should return false", async () => {
            const hasVotedTwice = await users[0].hasVotedTwice(ballot.index)

            expect(hasVotedTwice).toBeFalsy()
        })

        it("Should check if a user has voted twice and should return true", async () => {
            await ballot.vote(users[0], 3)
            const hasVotedTwice = await users[0].hasVotedTwice(ballot.index)

            expect(hasVotedTwice).toBeTruthy()
        })
    })
})
