registerArgType(scriptName, async (item, data, args) => {
  item = item.toLowerCase()
  if (args.categories && client.categories[item]) return client.categories[item]
  let cmd = client.prefixCommands.get(item)
  if (cmd) return cmd
  cmd = await wrongCommand(item, data.message, data).catch(() => false)
  if (cmd) return cmd[0]
})