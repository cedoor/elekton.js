import { ContractInterface } from "ethers"

export interface ElektonConfig {
    contractAddress: string
    contractInterface: ContractInterface
    ethereumProvider?: string
    ipfsProvider?: string
}
