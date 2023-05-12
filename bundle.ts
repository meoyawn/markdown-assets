import pkg from "./package.json"
import { build } from "bun"

await build({
  outdir: "dist/",
  entrypoints: ["src/index.ts"],
  external: Object.keys(pkg.dependencies),
  target: "node",
})
