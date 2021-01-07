import { Elekton } from "../src/Elekton"
import { User } from "../src/User"
import { Ballot } from "../src/Ballot"
import { createElektonInstance, createUsers, deployElektonContract, getLastBlockTimestamp } from "./utils"
import { Contract } from "ethers"

describe("User", () => {
    let contract: Contract
    let elekton: Elekton
    let users: User[]

    const ballots: Ballot[] = []

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
            const startDate = timestamp + 600
            const endDate = timestamp + 700

            const ballot = (await users[0].createBallot({
                name,
                description,
                proposals,
                voterPublicKeys,
                startDate,
                endDate
            })) as Ballot

            expect(ballot).toBeInstanceOf(Ballot)
            expect(ballot.ipfsCid).not.toBeNull()

            ballots.push(ballot)
        })
    })
})
