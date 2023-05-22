import { extractSlug } from "./slug.js"
import { expect, test } from "bun:test"

test("just slug", () => {
  expect(extractSlug("slug1")).toBe("slug1")
})

test("empty", () => {
  expect(extractSlug("")).toBe("")
})

test("vabc-vabc", () => {
  expect(extractSlug("vabc-vabc")).toBe("vabc-vabc")
})

test("just slug separator", () => {
  expect(extractSlug("slug_1")).toBe("slug_1")
})

test('should correctly extract "slug1" from "001_slug1"', () => {
  expect(extractSlug("001_slug1")).toBe("slug1")
})

test("002_slug2", () => {
  expect(extractSlug("002_slug2")).toBe("slug2")
})

test('should correctly extract "slug1" from "01-slug1"', () => {
  expect(extractSlug("01-slug1")).toBe("slug1")
})

test("02-slug2", () => {
  expect(extractSlug("02-slug2")).toBe("slug2")
})

test('should correctly extract "slug1" from "V001-slug1"', () => {
  expect(extractSlug("V001-slug1")).toBe("slug1")
})

test('should correctly extract "slug2" from "V002-slug2"', () => {
  expect(extractSlug("V002-slug2")).toBe("slug2")
})

test('should correctly extract "slug1" from "01.slug1"', () => {
  expect(extractSlug("01.slug1")).toBe("slug1")
})

test('should correctly extract "slug2" from "02.slug2"', () => {
  expect(extractSlug("02.slug2")).toBe("slug2")
})

test('should return "01" when input is "01"', () => {
  expect(extractSlug("01")).toEqual("01")
})

test('should return "02" when input is "02"', () => {
  expect(extractSlug("02")).toEqual("02")
})

test('should correctly extract "organize-md" from "01-organize-md"', () => {
  expect(extractSlug("01-organize-md")).toEqual("organize-md")
})

test('should correctly extract "organize_md" from "02.organize_md"', () => {
  expect(extractSlug("02.organize_md")).toEqual("organize_md")
})
