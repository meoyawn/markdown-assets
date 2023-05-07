import { expect, test } from "vitest"

import { modifyMD } from "./index"

test("modify the string", () => {
  expect(modifyMD("")).toEqual({ type: "root", children: [] })
})
