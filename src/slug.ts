export function extractSlug(dirname: string): string {
  const matches = dirname.match(/[^a-zA-Z0-9](.+$)/)
  return matches ? matches[1] : ""
}
