import { helloWorld } from "../src"

describe("Index", () => {
    describe("Hello world", () => {
        it("Function should return 'Hello world' string", () => {
            expect(helloWorld()).toBe("Hello world")
        })
    })
})
