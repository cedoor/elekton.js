import { readFileSync } from "fs"
import { join } from "path"
import { connect } from "../src"
import { Elekton } from "../src/Elekton"
import { User } from "../src/User"
import { Ballot } from "../src/Ballot"

describe("User", () => {
    let elekton: Elekton
    const users: User[] = []
    const ballots: Ballot[] = []
    const userPrivateKeys = [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    ]

    beforeAll(async () => {
        const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
        const { abi } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))

        elekton = connect({
            contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            contractInterface: abi
        })

        for (const userPrivateKey of userPrivateKeys) {
            let user = await elekton.retrieveUser(userPrivateKey)

            if (!user) {
                user = await elekton.createUser(userPrivateKey, {
                    name: "name",
                    surname: "surname"
                })
            }

            users.push(user as User)
        }
    })

    describe("Create a ballot", () => {
        it("Should create a ballot", async () => {
            const name = "ballot"
            const description = "This is a ballot description"
            const proposals = ["Yes", "No"]
            const voters = users
            const startDate = Math.floor(Date.now() / 1000) + 30
            const endDate = Math.floor(Date.now() / 1000) + 60

            const ballot = (await users[0].createBallot({
                name,
                description,
                proposals,
                voters,
                startDate,
                endDate
            })) as Ballot

            expect(ballot).toBeInstanceOf(Ballot)
            expect(ballot.id).not.toBeNull()

            ballots.push(ballot)
        })
    })

    describe("Retrieve a ballot", () => {
        it("Should retrieve an existent ballot", async () => {
            const existentBallot = ballots[0] as Ballot
            const ballot = (await users[0].retrieveBallot(existentBallot.id as string)) as Ballot

            expect(ballot.name).toBe(ballots[0].name)
            expect(ballot.description).toBe(ballots[0].description)
        })
    })
})
