import { Elekton } from "./Elekton"
import { ElektonConfig } from "./types"
import IpfsHttpClient from "ipfs-http-client"
import { Contract, providers } from "ethers"

export async function connect(elektonConfig: ElektonConfig): Promise<Elekton> {
    const provider = new providers.JsonRpcProvider(elektonConfig.ethereumProvider || "http://localhost:8545")
    const elektonContract = new Contract(elektonConfig.contractAddress, elektonConfig.contractInterface, provider)
    const ipfs = IpfsHttpClient({ url: elektonConfig.ipfsProvider || "http://localhost:5001" })

    return new Elekton(elektonContract, ipfs)
}
