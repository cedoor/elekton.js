import { Contract } from "ethers"
import { Ballot } from "../src/Ballot"
import { Elekton } from "../src/Elekton"
import { User } from "../src/User"
import {
    createBallot,
    createElektonInstance,
    createUsers,
    delay,
    deployElektonContract,
    getLastBlockTimestamp
} from "./utils"

describe("Ballot", () => {
    let contract: Contract
    let elekton: Elekton
    let users: User[]

    beforeAll(async () => {
        contract = await deployElektonContract()
        elekton = await createElektonInstance(contract)
        users = await createUsers(elekton)
    })

    describe("Vote", () => {
        it("Should vote in a ballot anonymously", async () => {
            const timestamp = await getLastBlockTimestamp(contract.provider)
            const startDate = timestamp + 5
            const endDate = timestamp + 15
            const ballot = (await createBallot(users, startDate, endDate)) as Ballot
            const vote = 3

            await delay(5000)

            await ballot.vote(users[0], vote)

            expect(ballot.votes[0]).toBe(vote)
        })
    })
})
