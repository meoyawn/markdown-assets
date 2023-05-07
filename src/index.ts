import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join as pathJoin } from "path"
import { createHash } from "crypto"

import type { Root as MDRoot } from "mdast"
import { map as unistMap } from "unist-util-map"
import { fromHtml } from "hast-util-from-html"
import { toHtml } from "hast-util-to-html"
import { load as fromYaml } from "js-yaml"

import { fromMD, toMD } from "./md"

// for each markdown
// for each image
// copy image to /images
// replace image path with /images
// write the file back

// for remix: sync s3

interface Ctx {
  /**
   * img files are moved here for CDN rule purposes
   */
  readonly imgURLPrefix: string
  readonly slug: string
  readonly filenames: ReadonlyArray<string>
  readonly meta: Record<string, Record<string, unknown>>
}

const modifyImg = ({ slug, imgURLPrefix }: Ctx, url: string): string =>
  pathJoin(imgURLPrefix, slug, url)

const modifyHtmlImg = (ctx: Ctx, html: string): string =>
  toHtml(
    unistMap(fromHtml(html), node => {
      if (node.type !== "element") return node

      switch (node.tagName) {
        case "img":
          if (!node.properties) return node

          const { src } = node.properties
          if (typeof src !== "string") return node

          return {
            ...node,
            properties: { ...node.properties, src: modifyImg(ctx, src) },
          }

        default:
          return node
      }
    }),
  )

export const modifyMD = (ctx: Ctx, mdS: string): MDRoot =>
  unistMap(fromMD(mdS), n => {
    switch (n.type) {
      case "image":
        return { ...n, url: modifyImg(ctx, n.url) }

      case "html":
        return { ...n, value: modifyHtmlImg(ctx, n.value) }

      case "yaml":
        let value: string = n.value
        for (const file of ctx.filenames) {
          if (value.includes(file)) {
            value = value.replace(file, modifyImg(ctx, file))
          }
        }

        ctx.meta[ctx.slug] = fromYaml(value) as Record<string, unknown>

        return { ...n, value }

      default:
        return n
    }
  })

const isVisible = (filename: string): boolean => !filename.startsWith(".")

const isMD = (filename: string): boolean => filename.endsWith(".md")

/**
 * hash file contents, output `length` chars
 *
 * bun runtime doesn't support `shake256` so we just substring
 */
const hash = async (filepath: string, length: number = 6): Promise<string> =>
  createHash("sha256")
    .update(await readFile(filepath))
    .digest("hex")
    .slice(0, length)

/**
 * add hash to filename before the extension
 */
const hashFilename = (filename: string, hash: string): string => {
  const dotIdx = filename.lastIndexOf(".")

  return dotIdx === -1
    ? `${filename}-${hash}`
    : `${filename.slice(0, dotIdx)}-${hash}${filename.slice(dotIdx)}`
}

async function main() {
  const inContent = "/Users/adelnizamutdinov/listenbox/front/content2"
  const outContent = "/Users/adelnizamutdinov/listenbox/front/out"

  const mdDirs = (await readdir(inContent)).filter(isVisible)
  if (!mdDirs.length) throw new Error("empty dir")

  const ctx: Ctx = {
    imgURLPrefix: "images/",
    filenames: [],
    slug: "",
    meta: {},
  }

  for (const dir of mdDirs) {
    const inDir = pathJoin(inContent, dir)
    const outDir = pathJoin(outContent, dir)

    const rawFilenames = await readdir(inDir)
    const filenames = rawFilenames.filter(isVisible)

    const mdFilename = filenames.find(isMD)
    if (!mdFilename) throw new Error(`no .md file in ${dir}`)

    await mkdir(outDir, { recursive: true })

    for (const filename of filenames.filter(x => !isMD(x))) {
      const inPath = pathJoin(inDir, filename)
      const hsh = await hash(inPath)
      await copyFile(inPath, pathJoin(outDir, hashFilename(filename, hsh)))
    }

    const tree = modifyMD(
      { ...ctx, slug: dir, filenames },
      await readFile(pathJoin(inDir, mdFilename), "utf-8"),
    )
    await writeFile(pathJoin(outDir, mdFilename), toMD(tree))
  }

  await writeFile(pathJoin(outContent, "meta.json"), JSON.stringify(ctx.meta))
}

await main()
