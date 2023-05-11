import pkg from "./package.json"
import { build } from "bun"

await build({
  outdir: "dist/",
  entryPoints: ["src/index.ts"],
  external: Object.keys(pkg.dependencies),
  target: "node",
})
