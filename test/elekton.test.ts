import { readFileSync } from "fs"
import { connect } from "../src"
import { Elekton } from "../src/Elekton"
import { join } from "path"

describe("Elekton", () => {
    describe("Connect to providers", () => {
        it("Connect function should return an Elekton instance with connected providers", async () => {
            const abiPath = "../../contracts/build/contracts/contracts/Elekton.sol/Elekton.json"
            const { abi } = JSON.parse(readFileSync(join(__dirname, abiPath), "utf8"))

            const elekton = await connect({
                contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                contractInterface: abi
            })

            expect(elekton).toBeInstanceOf(Elekton)
        })
    })
})
