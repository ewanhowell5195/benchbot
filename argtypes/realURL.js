registerArgType(scriptName, async (item, args) => {
  item = await argTypes.url(item)
  if (!item) return
  try {
    const r = await fetch(item, { method: "HEAD" })
    if (r.status < 400) return [item, r]
    if (!args?.errorless) return sendError(args.message, {
      title: "Failed to get URL",
      description: `The URL returned an error code: \`${r.status}\``
    })
  } catch {
    if (!args?.errorless) return sendError(args.message, {
      title: "Failed to get URL",
      description: "The URL did not respond"
    })
  }
})