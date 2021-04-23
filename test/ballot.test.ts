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
    let ballot: Ballot

    beforeAll(async () => {
        contract = await deployElektonContract()
        elekton = await createElektonInstance(contract)
        users = await createUsers(elekton)
    })

    describe("Vote", () => {
        it("Should vote in a ballot anonymously", async () => {
            const timestamp = await getLastBlockTimestamp(contract.provider)
            const startDate = timestamp + 2
            const endDate = timestamp + 15
            ballot = (await createBallot(users, startDate, endDate)) as Ballot
            const vote = 3

            await ballot.vote(users[0], vote)

            expect(ballot.votes[0]).toBe(vote)
        })
    })

    describe("Publish decryption key", () => {
        it("Should publish a ballot decryption key", async () => {
            const decryptionKey = 3

            await delay(10000)
            await ballot.publishDecryptionKey(users[0], decryptionKey)

            expect(ballot.decryptionKey).toBe(decryptionKey)
        })
    })

    describe("Retrieve votes", () => {
        it("Should retrieve the ballot votes", async () => {
            const votes = await ballot.retrieveVotes()

            expect(votes.length).toBe(1)
            expect(votes[0]).toBe(3)
        })
    })

    describe("Add ballot event listeners", () => {
        let users: User[]
        let ballot: Ballot

        beforeAll(async () => {
            users = await createUsers(elekton)

            const timestamp = await getLastBlockTimestamp(contract.provider)
            const startDate = timestamp + 2
            const endDate = timestamp + 15

            ballot = (await createBallot(users, startDate, endDate)) as Ballot
        })

        it("Should create a listener for the VoteAdded event", async (done) => {
            const unsubscribe = ballot.onVoteAdded((vote: number) => {
                expect(vote).toEqual(3)
                unsubscribe()
                done()
            })

            await ballot.vote(users[0], 3)
        })

        it("Should create a listener for the DecryptionKeyPublished event", async (done) => {
            const unsubscribe = ballot.onDecryptionKeyPublished((decryptionKey: number) => {
                expect(decryptionKey).toEqual(2)
                unsubscribe()
                done()
            })

            await delay(10000)

            await ballot.publishDecryptionKey(users[0], 2)
        })
    })
})
