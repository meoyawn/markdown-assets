import pkg from "./package.json"

await Bun.build({
  outdir: "dist/",
  entrypoints: ["src/index.ts"],
  external: Object.keys(pkg.dependencies),
  target: "node",
})
