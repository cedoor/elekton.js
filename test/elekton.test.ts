import { readFileSync } from "fs"
import { connect } from "../src"
import { Elekton } from "../src/Elekton"
import { join } from "path"

describe("Elekton", () => {
    const userPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    let elekton: Elekton

    describe("Connect to providers", () => {
        it("Should return an Elekton instance", async () => {
            const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
            const { abi } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))

            elekton = await connect({
                contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                contractInterface: abi
            })

            expect(elekton).toBeInstanceOf(Elekton)
        })
    })

    describe("Create a user", () => {
        it("Should create a user, if it doesn't exist", async () => {
            try {
                const user = await elekton.createUser(userPrivateKey, {
                    name: "name",
                    surname: "surname"
                })

                expect(user.name).toBe("name")
                expect(user.surname).toBe("surname")
            } catch (error) {
                expect(error.message).toMatch("User data already exists")
            }
        })

        it("Should not create a user because it already exists", async () => {
            try {
                await elekton.createUser(userPrivateKey, {
                    name: "name",
                    surname: "surname"
                })
            } catch (error) {
                expect(error.message).toMatch("User data already exists")
            }
        })
    })

    describe("Retrieve a user", () => {
        it("Should retrieve an existent user", async () => {
            const user = await elekton.retrieveUser(userPrivateKey)

            expect(user.name).toBe("name")
            expect(user.surname).toBe("surname")
        })
    })
})
