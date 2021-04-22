import { BigNumber, utils } from "ethers"
import { groth16 } from "snarkjs"
import IpfsHttpClient from "ipfs-http-client"
import { babyJub, poseidon } from "circomlib"
import { SMT } from "@cedoor/smt"
import { ChildNodes } from "@cedoor/smt/dist/types/smt"

export function fromHexToCid(ipfsCidHex: string): string {
    const { CID } = IpfsHttpClient as any

    const ipfsCid = new CID(utils.arrayify(`0x1220${ipfsCidHex.slice(2)}`))

    return ipfsCid.toString()
}

export function decodeUint8Array(array: Uint8Array): string {
    const utf8Decoder = new TextDecoder("utf8")

    return utf8Decoder.decode(array)
}

export function fromCidToHex(ipfsCid: any | string): string {
    const { CID } = IpfsHttpClient as any

    if (typeof ipfsCid === "string") {
        ipfsCid = new CID(ipfsCid)
    }

    return utils.hexlify(ipfsCid.multihash.slice(2))
}

export function createSparseMerkleTree(voterPublicKeys: string[]): SMT {
    const hash = (childNodes: ChildNodes) => poseidon(childNodes)
    const tree = new SMT(hash, true)

    for (const voterPublicKey of voterPublicKeys) {
        const voterPublicKeyPoint = unpackVoterPublicKey(voterPublicKey)

        tree.add(voterPublicKeyPoint[0], voterPublicKeyPoint[1])
    }

    return tree
}

export function unpackVoterPublicKey(voterPublicKey: string): [bigint, bigint] {
    const voterPublicKeyBuffer = utils.arrayify(voterPublicKey).buffer

    return babyJub.unpackPoint(voterPublicKeyBuffer)
}

export function hexToBuffer(hex: string): Buffer {
    hex = hex.startsWith("0x") ? hex.slice(2) : hex

    return Buffer.from(hex, "hex")
}

export async function getProofParameters(input: any, wasmFilePath: string, zkeyFilePath: string) {
    const { proof, publicSignals } = await groth16.fullProve(input, wasmFilePath, zkeyFilePath)

    return [
        [fromBigNumberToBytes32(proof.pi_a[0]), fromBigNumberToBytes32(proof.pi_a[1])],
        [
            [fromBigNumberToBytes32(proof.pi_b[0][1]), fromBigNumberToBytes32(proof.pi_b[0][0])],
            [fromBigNumberToBytes32(proof.pi_b[1][1]), fromBigNumberToBytes32(proof.pi_b[1][0])]
        ],
        [fromBigNumberToBytes32(proof.pi_c[0]), fromBigNumberToBytes32(proof.pi_c[1])],
        publicSignals.map((n: any) => fromBigNumberToBytes32(n))
    ]
}

export function fromBigNumberToBytes32(n: any) {
    const hex = BigNumber.from(n).toHexString()

    return utils.hexZeroPad(hex, 32)
}

export function isWebSocketURL(url: string): boolean {
    return new URL(url).protocol === "ws:"
}
