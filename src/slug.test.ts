import { extractSlug } from "./slug.js"
import { expect, test } from "bun:test"

test("should extract slug from format 001_slug1", () => {
  expect(extractSlug("001_slug1")).toBe("slug1")
})

test("should extract slug from format 01-slug1", () => {
  expect(extractSlug("01-slug1")).toBe("slug1")
})

test("should extract slug from format V001-slug1", () => {
  expect(extractSlug("V001-slug1")).toBe("slug1")
})

test("should extract slug from format 01.slug1", () => {
  expect(extractSlug("01.slug1")).toBe("slug1")
})

test("should return empty string if there is no slug", () => {
  expect(extractSlug("01")).toEqual("")
})

test("delimiters in slug", () => {
  expect(extractSlug("01-organize-md")).toEqual("organize-md")
  expect(extractSlug("02.organize_md")).toEqual("organize_md")
})
