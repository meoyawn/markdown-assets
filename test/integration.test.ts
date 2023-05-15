import { onContentChange } from "../src/index.js"
import { expect, test } from "bun:test"
import { readdir, readFile } from "fs/promises"
import { join as pathJoin } from "path"
import { withDir } from "tmp-promise"

const tmpDir =
  (f: (dir: string) => Promise<void> | void): (() => Promise<void>) =>
  () =>
    withDir(async ({ path }) => await f(path), { unsafeCleanup: true })

test(
  "adellol",
  tmpDir(async tmp => {
    const contentDir = "test/adellol/"
    expect(await readdir(contentDir)).toEqual([
      "002-responsibleapi",
      "001-organize-md",
    ])

    const mdOutDir = pathJoin(tmp, "md")
    await onContentChange({
      contentDir,
      mdOutDir,
      imgOutDir: pathJoin(tmp, "img"),
      imgURLPrefix: "/img",
    })

    expect(await readdir(mdOutDir)).toEqual([
      "responsibleapi.md",
      "organize-md.md",
      "meta.json",
    ])

    expect(
      JSON.parse(await readFile(pathJoin(mdOutDir, "meta.json"), "utf-8")),
    ).toEqual({
      "organize-md": {
        title:
          "Organizing Markdown for Next.js and Remix Websites with the `organize-md` Script",
        description:
          "Discover how to optimize content organization and improve load times on your Next.js or Remix websites using the `organize-md` script.",
        date: "2023-05-13T00:00:00.000Z",
      },
      responsibleapi: {
        date: "2023-05-10T00:00:00.000Z",
        description:
          "Automatically publishing your YouTube content as a podcast",
        draft: true,
        title: "Publish your YouTube podcast on iTunes and Spotify",
      },
    })
  }),
)
