import sourceMaps from "rollup-plugin-sourcemaps"
import typescript from "rollup-plugin-typescript2"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

const pkg = require("./package.json")

const banner = `/**
 * @module ${pkg.name}
 * @version ${pkg.version}
 * @file ${pkg.description}
 * @copyright ${pkg.author.name} ${new Date().getFullYear()}
 * @license ${pkg.license}
 * @see [Github]{@link ${pkg.homepage}}
*/`

export default {
    input: "src/index.ts",
    output: [
        {
            file: pkg.main,
            name: pkg.name,
            format: "umd",
            banner,
            globals: { ethers: "ethers", "ipfs-http-client": "IpfsHttpClient", circomlib: "circomlib" },
            sourcemap: true
        },
        { file: pkg.module, format: "es", banner, sourcemap: true }
    ],
    external: ["ethers", "ipfs-http-client", "circomlib"],
    watch: {
        include: "src/**"
    },
    plugins: [typescript({ useTsconfigDeclarationDir: true }), commonjs(), json(), nodeResolve(), sourceMaps()]
}
