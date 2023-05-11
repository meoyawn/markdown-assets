import pkg from "./package.json" assert { type: "json" }
import { build } from "esbuild"

await build({
  external: Object.keys(pkg.dependencies),
  outdir: "dist/",
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
})
