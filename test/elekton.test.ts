import { readFileSync } from "fs"
import { connect } from "../src"
import { Elekton } from "../src/Elekton"
import { join } from "path"
import { Wallet } from "ethers"
import { User } from "../src/User"

describe("Elekton", () => {
    let elekton: Elekton
    let userPrivateKey: string

    beforeAll(async () => {
        const wallet = Wallet.fromMnemonic("test test test test test test test test test test test junk")

        userPrivateKey = wallet.privateKey
    })

    describe("Connect to providers", () => {
        it("Should return an Elekton instance", async () => {
            const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
            const { abi } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))

            elekton = connect({
                contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                contractInterface: abi
            })

            expect(elekton).toBeInstanceOf(Elekton)
        })
    })

    describe("Create a user", () => {
        it("Should create a user, if it doesn't exist", async () => {
            const user = await elekton.createUser(userPrivateKey, {
                name: "name",
                surname: "surname"
            })

            if (user) {
                expect(user.name).toBe("name")
                expect(user.surname).toBe("surname")
            }
        })

        it("Should not create a user because it already exists", async () => {
            const user = await elekton.createUser(userPrivateKey, {
                name: "name",
                surname: "surname"
            })

            expect(user).toBeNull()
        })
    })

    describe("Retrieve a user", () => {
        it("Should retrieve an existent user", async () => {
            const user = (await elekton.retrieveUser(userPrivateKey)) as User

            expect(user.address).not.toBeUndefined()
            expect(user.voterPublicKey).not.toBeUndefined()
            expect(user.name).toBe("name")
            expect(user.surname).toBe("surname")
            expect(user.privateKey).toBe(userPrivateKey)
        })

        it("Should not retrieve an non-existent user", async () => {
            const wallet = Wallet.createRandom()
            const user = await elekton.retrieveUser(wallet.privateKey)

            expect(user).toBeNull()
        })

        it("Should retrieve a user by address", async () => {
            const wallet = new Wallet(userPrivateKey)
            const user = (await elekton.retrieveUser(wallet.address)) as User

            expect(user.address).not.toBeUndefined()
            expect(user.voterPublicKey).not.toBeUndefined()
            expect(user.name).toBe("name")
            expect(user.surname).toBe("surname")
            expect(user.privateKey).toBeUndefined()
        })
    })
})
