import { Contract, Wallet } from "ethers"
import { join } from "path"
import { connect } from "../src"
import { Ballot } from "../src/Ballot"
import { Elekton } from "../src/Elekton"
import { User } from "../src/User"
import { createBallot, createUsers, delay, deployElektonContract, getLastBlockTimestamp } from "./utils"

describe("Elekton", () => {
    let contract: Contract
    let elekton: Elekton
    let user: User

    describe("Connect to providers", () => {
        it("Should return an Elekton instance", async () => {
            contract = await deployElektonContract()

            elekton = connect({
                contractAddress: contract.address,
                contractInterface: contract.interface,
                wasmFilePath: join(__dirname, "../../contracts/build/snark/main.wasm"),
                zkeyFilePath: join(__dirname, "../../contracts/build/snark/circuit_final.zkey")
            })

            expect(elekton).toBeInstanceOf(Elekton)
        })
    })

    describe("Create a user", () => {
        it("Should create a user", async () => {
            user = (await elekton.createUser({
                name: "name",
                surname: "surname"
            })) as User

            expect(user.name).toBe("name")
            expect(user.surname).toBe("surname")
        })
    })

    describe("Retrieve a user", () => {
        it("Should retrieve an existent user", async () => {
            const existingUser = (await elekton.retrieveUser(user.privateKey as string)) as User

            expect(existingUser.address).not.toBeUndefined()
            expect(existingUser.voterPublicKey).not.toBeUndefined()
            expect(existingUser.name).toBe("name")
            expect(existingUser.surname).toBe("surname")
            expect(existingUser.privateKey).toBe(user.privateKey)
        })

        it("Should not retrieve an non-existent user", async () => {
            const wallet = Wallet.createRandom()
            const user = await elekton.retrieveUser(wallet.address)

            expect(user).toBeNull()
        })

        it("Should retrieve a user by address", async () => {
            const existingUser = (await elekton.retrieveUser(user.address as string)) as User

            expect(existingUser.address).not.toBeUndefined()
            expect(existingUser.voterPublicKey).not.toBeUndefined()
            expect(existingUser.name).toBe("name")
            expect(existingUser.surname).toBe("surname")
            expect(existingUser.privateKey).toBeUndefined()
        })
    })

    describe("Retrieve users", () => {
        it("Should retrieve the last user", async () => {
            const users = await elekton.retrieveUsers(1)

            expect(users.length).toBe(1)
            expect(users[0]).not.toBeNull()
        })
    })

    describe("Retrieve a ballot", () => {
        it("Should retrieve an existent ballot", async () => {
            const users = await createUsers(elekton)
            const timestamp = await getLastBlockTimestamp(contract.provider)
            const startDate = timestamp + 5
            const endDate = timestamp + 15
            const ballot = (await createBallot(users, startDate, endDate)) as Ballot

            const retrievedBallot = (await elekton.retrieveBallot(0)) as Ballot

            expect(retrievedBallot.name).toBe(ballot.name)
            expect(retrievedBallot.description).toBe(ballot.description)
        })
    })

    describe("Retrieve ballots", () => {
        it("Should retrieve a ballot", async () => {
            const ballots = await elekton.retrieveBallots()

            expect(ballots.length).toBe(1)
            expect(ballots[0]).not.toBeNull()
        })
    })

    describe("Add user event listeners", () => {
        it("Should create a listener for the UserCreated event", async (done) => {
            const unsubscribe = elekton.onUserCreated((user: User) => {
                expect(user.name).toEqual("name2")
                unsubscribe()
                done()
            })

            await elekton.createUser({
                name: "name2",
                surname: "surname2"
            })
        })
    })

    describe("Add ballot event listeners", () => {
        let users: User[]
        let ballot: Ballot

        beforeAll(async () => {
            users = await createUsers(elekton)
        })

        it("Should create a listener for the BallotCreated event", async (done) => {
            const timestamp = await getLastBlockTimestamp(contract.provider)
            const startDate = timestamp + 5
            const endDate = timestamp + 15

            const unsubscribe = elekton.onBallotCreated((ballot: Ballot) => {
                expect(ballot.index).toEqual(1)
                unsubscribe()
                done()
            })

            ballot = (await createBallot(users, startDate, endDate)) as Ballot
        })

        it("Should create a listener for the VoteAdded event", async (done) => {
            const unsubscribe = elekton.onVoteAdded(ballot.index, (vote: number) => {
                expect(vote).toEqual(3)
                unsubscribe()
                done()
            })

            await ballot.vote(users[0], 3)
        })

        it("Should create a listener for the DecryptionKeyPublished event", async (done) => {
            const unsubscribe = elekton.onDecryptionKeyPublished(ballot.index, (decryptionKey: number) => {
                expect(decryptionKey).toEqual(2)
                unsubscribe()
                done()
            })

            await delay(5000)

            await ballot.publishDecryptionKey(users[0], 2)
        })
    })
})
