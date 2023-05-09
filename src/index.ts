import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join as pathJoin } from "path"
import { createHash } from "crypto"

import type { Root as MDRoot } from "mdast"
import { map as unistMap } from "unist-util-map"
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
  readonly hashedNames: Record<string, Record<string, string>>
}

const modifyImg = (
  { slug, imgURLPrefix, hashedNames }: Ctx,
  url: string,
): string => pathJoin(imgURLPrefix, slug, hashedNames[slug][url])

const replaceFilenames = (ctx: Ctx, s: string) => {
  let value: string = s
  for (const file of ctx.filenames) {
    if (value.includes(file)) {
      value = value.replace(file, modifyImg(ctx, file))
    }
  }
  return value
}

export const modifyMD = (ctx: Ctx, md: MDRoot): MDRoot =>
  unistMap(md, n => {
    switch (n.type) {
      case "image":
        return { ...n, url: modifyImg(ctx, n.url) }

      case "html":
        return { ...n, value: replaceFilenames(ctx, n.value) }

      case "yaml": {
        const value = replaceFilenames(ctx, n.value)
        ctx.meta[ctx.slug] = fromYaml(value) as Record<string, unknown>
        return { ...n, value }
      }

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
const sha256 = async (filepath: string, length: number = 6): Promise<string> =>
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
  const inContent = "/Users/adelnizamutdinov/listenbox/front/content/"
  const outMD = "/Users/adelnizamutdinov/listenbox/front/public/guides/"
  const outImages =
    "/Users/adelnizamutdinov/listenbox/front/public/images/guides/"
  const imgURLPrefix = "/images/guides/"

  const rawDirs = await readdir(inContent)
  const mdDirs = rawDirs.filter(isVisible)
  if (!mdDirs.length) throw new Error("empty dir")

  await mkdir(outMD, { recursive: true })

  const ctx: Ctx = {
    imgURLPrefix,
    filenames: [],
    slug: "",
    meta: {},
    hashedNames: {},
  }

  for (const slug of mdDirs) {
    ctx.hashedNames[slug] = {}

    const inDir = pathJoin(inContent, slug)

    const rawFilenames = await readdir(inDir)
    const filenames = rawFilenames.filter(isVisible)

    const mdFilename = filenames.find(isMD)
    if (!mdFilename) throw new Error(`no .md file in ${slug}`)

    const images = filenames.filter(x => !isMD(x))
    if (images.length) {
      const outImagesSlug = pathJoin(outImages, slug)
      await mkdir(outImagesSlug, { recursive: true })

      for (const img of images) {
        const inPath = pathJoin(inDir, img)
        const hash = await sha256(inPath)
        const hashedName = hashFilename(img, hash)

        await copyFile(inPath, pathJoin(outImagesSlug, hashedName))
        ctx.hashedNames[slug][img] = hashedName
      }
    }

    const mdS1 = await readFile(pathJoin(inDir, mdFilename), "utf-8")
    const mds2 = toMD(modifyMD({ ...ctx, slug, filenames }, fromMD(mdS1)))
    await writeFile(pathJoin(outMD, `${slug}.md`), mds2)
  }

  await writeFile(pathJoin(outMD, "meta.json"), JSON.stringify(ctx.meta))
}

await main()
