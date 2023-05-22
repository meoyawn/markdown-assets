const splitAtFirstOccurrence = (
  str: string,
  regex: RegExp,
): ReadonlyArray<string> => {
  const match = str.match(regex)
  const index = match?.index
  return index
    ? [str.substring(0, index), str.substring(index + match[0].length)]
    : [str]
}

export const extractSlug = (str: string): string => {
  const parts = splitAtFirstOccurrence(str, /[_\-.]/)

  if (parts.length === 1) {
    return parts[0]
  }

  if (Number(parts[0].toLowerCase().replace("v", "")) >= 0) {
    return parts[1]
  }

  return str
}
