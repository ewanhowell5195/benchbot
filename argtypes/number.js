registerArgType(scriptName, (item, data) => {
  const parsed = parseFloat(item)
  if (!isNaN(parsed)) {
    if (parsed === Infinity || parsed > Number.MAX_SAFE_INTEGER || parsed < Number.MIN_SAFE_INTEGER) {
      if (data.message) {
        if (data.errorless) return
        return sendError(data.message, {
          title: "Unsupported number",
          description: `\`${limit(item)}\` is an unsupported number\n\nNumbers must be between \`${Number.MIN_SAFE_INTEGER}\` and \`${Number.MAX_SAFE_INTEGER}\``,
          processing: data.processing,
          fetch: true
        })
      }
      else if (data.interaction) {
        if (!data.errorless) sendPrivateError(data.interaction, {
          title: "Unsupported number",
          description: `\`${limit(item)}\` is an unsupported number\n\nNumbers must be between \`${Number.MIN_SAFE_INTEGER}\` and \`${Number.MAX_SAFE_INTEGER}\``,
          fetch: true
        })
        return false
      }
      return
    }
    return parsed
  }
})