import { ContractInterface } from "ethers"

export interface ElektonConfig {
    contractAddress: string
    contractInterface: ContractInterface
    wasmFilePath: string
    zkeyFilePath: string
    ethereumProvider?: string
    ipfsProvider?: string
}
