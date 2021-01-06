import { connect } from "../src"
import { Elekton } from "../src/Elekton"
import { Wallet } from "ethers"
import { User } from "../src/User"
import { deployElektonContract, userPrivateKeys } from "./utils"
import { join } from "path"

describe("Elekton", () => {
    let elekton: Elekton

    describe("Connect to providers", () => {
        it("Should return an Elekton instance", async () => {
            const contract = await deployElektonContract()

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
            const user = (await elekton.createUser(userPrivateKeys[0], {
                name: "name",
                surname: "surname"
            })) as User

            expect(user.name).toBe("name")
            expect(user.surname).toBe("surname")
        })

        it("Should update user data", async () => {
            const user = (await elekton.createUser(userPrivateKeys[0], {
                name: "name2",
                surname: "surname2"
            })) as User

            expect(user.name).toBe("name2")
            expect(user.surname).toBe("surname2")
        })
    })

    describe("Retrieve a user", () => {
        it("Should retrieve an existent user", async () => {
            const user = (await elekton.retrieveUser(userPrivateKeys[0])) as User

            expect(user.address).not.toBeUndefined()
            expect(user.voterPublicKey).not.toBeUndefined()
            expect(user.name).toBe("name2")
            expect(user.surname).toBe("surname2")
            expect(user.privateKey).toBe(userPrivateKeys[0])
        })

        it("Should not retrieve an non-existent user", async () => {
            const wallet = Wallet.createRandom()
            const user = await elekton.retrieveUser(wallet.address)

            expect(user).toBeNull()
        })

        it("Should retrieve a user by address", async () => {
            const wallet = new Wallet(userPrivateKeys[0])
            const user = (await elekton.retrieveUser(wallet.address)) as User

            expect(user.address).not.toBeUndefined()
            expect(user.voterPublicKey).not.toBeUndefined()
            expect(user.name).toBe("name2")
            expect(user.surname).toBe("surname2")
            expect(user.privateKey).toBeUndefined()
        })
    })
})
