import { frontmatter, Preset } from "micromark-extension-frontmatter"
import {
  frontmatterFromMarkdown,
  frontmatterToMarkdown,
} from "mdast-util-frontmatter"
import type { Root as MDRoot } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { toMarkdown } from "mdast-util-to-markdown"

const fmOpts: Array<Preset> = ["yaml"]
const md2fm = frontmatterFromMarkdown(fmOpts)
const fm = frontmatter(fmOpts)
const fm2md = frontmatterToMarkdown(fmOpts)

export const fromMD = (mdS: string): MDRoot =>
  fromMarkdown(mdS, { mdastExtensions: [md2fm], extensions: [fm] })

export const toMD = (tree: MDRoot): string =>
  toMarkdown(tree, { extensions: [fm2md] })
