import { BigNumber, utils } from "ethers"
import { groth16 } from "snarkjs"
import IpfsHttpClient from "ipfs-http-client"
import { smt, babyJub } from "circomlib"

export function fromHexToCid(ipfsCidHex: string): string {
    const { CID } = IpfsHttpClient as any

    const ipfsCid = new CID(utils.arrayify(`0x1220${ipfsCidHex.slice(2)}`))

    return ipfsCid.toString()
}

export function fromCidToHex(ipfsCid: any | string): string {
    const { CID } = IpfsHttpClient as any

    if (typeof ipfsCid === "string") {
        ipfsCid = new CID(ipfsCid)
    }

    return utils.hexlify(ipfsCid.multihash.slice(2))
}

export async function createSparseMerkleTree(voterPublicKeys: string[]): Promise<any> {
    const tree = await smt.newMemEmptyTrie()

    for (const voterPublicKey of voterPublicKeys) {
        const voterPublicKeyPoint = unpackVoterPublicKey(voterPublicKey)

        await tree.insert(...voterPublicKeyPoint)
    }

    return tree
}

export function unpackVoterPublicKey(voterPublicKey: string): [BigInt, BigInt] {
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

export async function fromBigNumberToBytes32(n: any) {
    const hex = BigNumber.from(n).toHexString()

    return utils.hexZeroPad(hex, 32)
}
