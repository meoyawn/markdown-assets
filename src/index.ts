import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join as pathJoin } from "path"
import { createHash } from "crypto"

import type { Root as MDRoot } from "mdast"
import { map as unistMap } from "unist-util-map"
import { load as fromYaml } from "js-yaml"

import { frontmatter, Preset } from "micromark-extension-frontmatter"
import {
  frontmatterFromMarkdown,
  frontmatterToMarkdown,
} from "mdast-util-frontmatter"
import { fromMarkdown } from "mdast-util-from-markdown"
import { toMarkdown } from "mdast-util-to-markdown"

const fmOpts: Array<Preset> = ["yaml"]
const md2fm = frontmatterFromMarkdown(fmOpts)
const fm = frontmatter(fmOpts)
const fm2md = frontmatterToMarkdown(fmOpts)

const fromMD = (mdS: string): MDRoot =>
  fromMarkdown(mdS, { mdastExtensions: [md2fm], extensions: [fm] })

const toMD = (tree: MDRoot): string => toMarkdown(tree, { extensions: [fm2md] })

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

const replaceImg = (
  { slug, imgURLPrefix, hashedNames }: Ctx,
  url: string,
): string => pathJoin(imgURLPrefix, slug, hashedNames[slug][url])

const replaceFilenames = (ctx: Ctx, s: string): string => {
  let value: string = s

  for (const file of ctx.filenames) {
    if (value.includes(file)) {
      value = value.replace(file, replaceImg(ctx, file))
    }
  }

  return value
}

const modifyMD = (ctx: Ctx, md: MDRoot): MDRoot =>
  unistMap(md, n => {
    switch (n.type) {
      case "image":
        return { ...n, url: replaceImg(ctx, n.url) }

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

interface Config {
  readonly contentDir: string
  readonly mdOutDir: string
  readonly imgOutDir: string
  readonly imgURLPrefix: string
}

export async function main(): Promise<void> {
  const configFile = process.argv[2]
  if (!configFile) throw new Error("pass a json config file")

  const { contentDir, imgOutDir, imgURLPrefix, mdOutDir }: Config = JSON.parse(
    await readFile(configFile, "utf-8"),
  )

  const rawDirs = await readdir(contentDir)
  const mdDirs = rawDirs.filter(isVisible)
  if (!mdDirs.length) throw new Error("empty dir")

  await mkdir(mdOutDir, { recursive: true })

  const ctx: Ctx = {
    imgURLPrefix: imgURLPrefix,
    filenames: [],
    slug: "",
    meta: {},
    hashedNames: {},
  }

  for (const slug of mdDirs) {
    ctx.hashedNames[slug] = {}

    const inDir = pathJoin(contentDir, slug)

    const rawFilenames = await readdir(inDir)
    const filenames = rawFilenames.filter(isVisible)

    const mdFilename = filenames.find(isMD)
    if (!mdFilename) throw new Error(`no .md file in ${slug}`)

    const images = filenames.filter(x => !isMD(x))
    if (images.length) {
      const outImagesSlug = pathJoin(imgOutDir, slug)
      await mkdir(outImagesSlug, { recursive: true })

      for (const img of images) {
        const inPath = pathJoin(inDir, img)
        const hash = await sha256(inPath)
        const hashedName = hashFilename(img, hash)

        await copyFile(inPath, pathJoin(outImagesSlug, hashedName))
        ctx.hashedNames[slug][img] = hashedName
      }
    }

    const mdIn = await readFile(pathJoin(inDir, mdFilename), "utf-8")
    const mdOut = toMD(modifyMD({ ...ctx, slug, filenames }, fromMD(mdIn)))
    await writeFile(pathJoin(mdOutDir, `${slug}.md`), mdOut)
  }

  await writeFile(pathJoin(mdOutDir, "meta.json"), JSON.stringify(ctx.meta))
}
