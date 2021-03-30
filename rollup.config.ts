import typescript from "rollup-plugin-typescript2"

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
    output: [{ file: pkg.main, format: "cjs", banner }],
    external: Object.keys(pkg.dependencies),
    plugins: [typescript({ useTsconfigDeclarationDir: true })]
}
