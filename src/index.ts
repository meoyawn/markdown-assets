import pkg from "../package.json"
import { extractSlug } from "./slug.js"
import arg from "arg"
import { watch } from "chokidar"
import { createHash } from "crypto"
import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { load as fromYaml } from "js-yaml"
import { type Root as MDRoot } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import {
  frontmatterFromMarkdown,
  frontmatterToMarkdown,
} from "mdast-util-frontmatter"
import { toMarkdown } from "mdast-util-to-markdown"
import { frontmatter, type Preset } from "micromark-extension-frontmatter"
import { join as pathJoin } from "path"
import { map as unistMap } from "unist-util-map"
import { z } from "zod"

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

const modifyMD = (ctx: Ctx, md: MDRoot): MDRoot => {
  const ret = unistMap(md, n => {
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

  ctx.meta[ctx.slug] ||= {}

  return ret as MDRoot
}

const isVisible = (filename: string): boolean => !filename.startsWith(".")

const isMD = (filename: string): boolean => filename.endsWith(".md")

/**
 * hash file contents, output `length` chars
 *
 * bun runtime doesn't support `shake256` so we just substring
 */
const sha256 = async (filepath: string, length: number = 8): Promise<string> =>
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

const Config = z.object({
  contentDir: z
    .string()
    .regex(/\/$/)
    .transform(x => x as `${string}/`),
  mdOutDir: z.string().nonempty(),
  imgOutDir: z.string().nonempty(),
  imgURLPrefix: z
    .string()
    .regex(/^\//)
    .transform(x => x as `/${string}`),
})
type Config = z.infer<typeof Config>

const parseConfig = async (configPath: string): Promise<Config> => {
  const content = await readFile(configPath, "utf-8")
  const lower = configPath.toLowerCase()
  switch (true) {
    case lower.endsWith(".json"):
      return JSON.parse(content)

    case lower.endsWith(".yaml") || lower.endsWith(".yml"):
      return fromYaml(content) as Config

    default:
      throw new Error(`unknown config file type: ${configPath}`)
  }
}

export const onContentChange = async (config: Config): Promise<void> => {
  const { contentDir, imgOutDir, imgURLPrefix, mdOutDir } = Config.parse(config)

  const rawDirs = await readdir(contentDir)
  const mdDirs = rawDirs.filter(isVisible)
  if (!mdDirs.length) throw new Error(`${contentDir} is empty`)

  await mkdir(mdOutDir, { recursive: true })

  const ctx: Ctx = {
    imgURLPrefix: imgURLPrefix,
    filenames: [],
    slug: "",
    meta: {},
    hashedNames: {},
  }

  for (const dirname of mdDirs) {
    const slug = extractSlug(dirname)
    ctx.hashedNames[slug] ||= {}

    const inDir = pathJoin(contentDir, dirname)

    const rawFilenames = await readdir(inDir)
    const filenames = rawFilenames.filter(isVisible)

    const mdFilename = filenames.find(isMD)
    if (!mdFilename) throw new Error(`no .md file in ${dirname}`)

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

    const mdOutPath = pathJoin(mdOutDir, `${slug}.md`)
    console.log(`writing ${mdOutPath}`)
    await writeFile(mdOutPath, mdOut)
  }

  const metaPath = pathJoin(mdOutDir, "meta.json")
  console.log(`writing ${metaPath}`)
  await writeFile(metaPath, JSON.stringify(ctx.meta))
}

const help = `
Usage: markdown-assets [file]

Options:
  -w, --watch   Watch for changes in content dir
  --version     Print version
  --help        Print this help
`

// noinspection JSUnusedGlobalSymbols
export const main = async (): Promise<void> => {
  const args = arg({
    "--watch": Boolean,
    "--version": Boolean,
    "--help": Boolean,

    "-w": "--watch",
  })

  if (args["--version"]) {
    console.log(pkg.version)
    return
  }

  if (args["--help"]) {
    console.log(help)
    return
  }

  const configPath = args._[0]
  if (!configPath) throw new Error("pass a json or yaml config file")
  const config: Config = await parseConfig(configPath)

  await onContentChange(config)

  if (args["--watch"]) {
    watch(config.contentDir).on("change", () => onContentChange(config))
  }
}
