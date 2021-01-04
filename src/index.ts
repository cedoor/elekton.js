import { Elekton } from "./Elekton"
import { ElektonConfig } from "./types"

export function connect(elektonConfig: ElektonConfig): Elekton {
    return new Elekton(elektonConfig)
}
