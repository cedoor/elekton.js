import { babyJub, eddsa } from "circomlib"
import { BigNumber, Contract, providers, utils, VoidSigner, Wallet, constants } from "ethers"
import IpfsHttpClient from "ipfs-http-client"
import { Ballot } from "./Ballot"
import { BallotIpfsData, ElektonConfig, UserInputData, UserIpfsData } from "./types"
import { User } from "./User"
import { fromCidToHex, fromHexToCid, decodeUint8Array } from "./utils"

export class Elekton {
    private config: ElektonConfig
    private contract: Contract
    private ipfs: any

    constructor(elektonConfig: ElektonConfig) {
        const provider = new providers.JsonRpcProvider(elektonConfig.ethereumProvider || "http://localhost:8545")

        this.config = elektonConfig
        this.contract = new Contract(elektonConfig.contractAddress, elektonConfig.contractInterface, provider)
        this.ipfs = IpfsHttpClient({ url: elektonConfig.ipfsProvider || "http://localhost:5001" })
    }

    async createUser(privateKey: string, userInputData: UserInputData): Promise<User | null> {
        const wallet = new Wallet(privateKey, this.contract.provider)

        const voterPrivateKeyBuffer = Buffer.from(utils.randomBytes(32))
        const voterPublicKey = `0x${babyJub.packPoint(eddsa.prv2pub(voterPrivateKeyBuffer)).toString("hex")}`

        // Add user data to IPFS.
        const userIpfsData = { ...userInputData, address: wallet.address, voterPublicKey }
        const ipfsEntry = await this.ipfs.add(JSON.stringify(userIpfsData))
        const ipfsCidHex = fromCidToHex(ipfsEntry.cid)

        try {
            await this.contract.connect(wallet).createUser(ipfsCidHex)

            return new User({
                ...userIpfsData,
                contract: this.contract,
                ipfs: this.ipfs,
                config: this.config,
                ipfsCid: ipfsEntry.cid.toString(),
                privateKey,
                voterPrivateKey: BigNumber.from(voterPrivateKeyBuffer).toHexString()
            })
        } catch (error) {
            return null
        }
    }

    async retrieveUser(privateKeyOrAddressOrIpfsCid: string): Promise<User | null> {
        const { CID } = IpfsHttpClient as any
        let ipfsCid, privateKey

        if (CID.isCID(privateKeyOrAddressOrIpfsCid)) {
            ipfsCid = privateKeyOrAddressOrIpfsCid
        } else {
            try {
                let ipfsCidHex: string

                if (utils.isAddress(privateKeyOrAddressOrIpfsCid)) {
                    const voidSigner = new VoidSigner(privateKeyOrAddressOrIpfsCid, this.contract.provider)

                    ipfsCidHex = await this.contract.connect(voidSigner).users(privateKeyOrAddressOrIpfsCid)
                } else {
                    const wallet = new Wallet(privateKeyOrAddressOrIpfsCid, this.contract.provider)

                    ipfsCidHex = await this.contract.connect(wallet).users(wallet.address)
                    privateKey = privateKeyOrAddressOrIpfsCid
                }

                if (ipfsCidHex === constants.HashZero) {
                    return null
                }

                ipfsCid = fromHexToCid(ipfsCidHex)
            } catch (error) {
                return null
            }
        }

        const { value } = await this.ipfs.cat(ipfsCid).next()
        const userIpfsData: UserIpfsData = JSON.parse(decodeUint8Array(value))

        return new User({
            ...userIpfsData,
            contract: this.contract,
            ipfs: this.ipfs,
            config: this.config,
            ipfsCid,
            privateKey
        })
    }

    async retrieveUsers(last = 5): Promise<User[]> {
        const filter = this.contract.filters.UserCreated()
        const userEvents = await this.contract.queryFilter(filter)
        const users: User[] = []

        if (userEvents.length < last) {
            last = userEvents.length
        }

        for (let i = userEvents.length - 1; i >= userEvents.length - last; i--) {
            const eventArgs = userEvents[i].args as any

            users.push((await this.retrieveUser(eventArgs._address)) as User)
        }

        return users
    }

    async retrieveBallot(index: number): Promise<Ballot> {
        const voidSigner = new VoidSigner(this.contract.address, this.contract.provider)
        const contractBallot = await this.contract.connect(voidSigner).ballots(index)

        const ipfsCid = fromHexToCid(contractBallot.data)
        const { value } = await this.ipfs.cat(ipfsCid).next()
        const ballotIpfsData = JSON.parse(decodeUint8Array(value)) as BallotIpfsData

        return new Ballot({
            ...ballotIpfsData,
            contract: this.contract,
            config: this.config,
            index,
            ipfsCid,
            votes: contractBallot.votes || [],
            decryptionKey: contractBallot.decryptionKey
        })
    }

    async retrieveBallots(last = 5): Promise<Ballot[]> {
        const filter = this.contract.filters.BallotCreated()
        const ballotEvents = await this.contract.queryFilter(filter)
        const ballots: Ballot[] = []

        if (ballotEvents.length < last) {
            last = ballotEvents.length
        }

        for (let i = ballotEvents.length - 1; i >= ballotEvents.length - last; i--) {
            const eventArgs = ballotEvents[i].args as any

            ballots.push((await this.retrieveBallot(eventArgs._index.toNumber())) as Ballot)
        }

        return ballots
    }

    onBallotCreated(listener: (ballot: Ballot) => void): () => void {
        const retrieveBallot = async (ballotIndex: BigNumber) => {
            const ballot = await this.retrieveBallot(ballotIndex.toNumber())

            return listener(ballot)
        }

        this.contract.on("BallotCreated", retrieveBallot)

        return this.contract.off.bind(this, "BallotCreated", retrieveBallot)
    }

    onVoteAdded(ballotIndex: number, listener: (vote: number) => void): () => void {
        const filter = this.contract.filters.VoteAdded(ballotIndex)
        const retrieveVote = (ballotIndex: BigNumber, vote: BigNumber) => {
            return listener(vote.toNumber())
        }

        this.contract.on(filter, retrieveVote)

        return this.contract.off.bind(this, filter, retrieveVote)
    }

    onDecryptionKeyPublished(ballotIndex: number, listener: (decryptionKey: number) => void): () => void {
        const filter = this.contract.filters.DecryptionKeyPublished(ballotIndex)
        const retrieveVote = (ballotIndex: BigNumber, decryptionKey: BigNumber) => {
            return listener(decryptionKey.toNumber())
        }

        this.contract.on(filter, retrieveVote)

        return this.contract.off.bind(this, filter, retrieveVote)
    }
}
