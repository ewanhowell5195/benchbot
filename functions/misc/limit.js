registerFunction(scriptName, (str, length = 128) => {
  if (str.length <= length) return str
  return str.slice(0, length - 1) + "…"
})