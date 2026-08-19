registerFunction(scriptName, async (message, command) => {
  if (!message.author) message.author = message.user
  const name = command.command ?? command.name
  if (client.commandInstances[name]?.includes(message.channelId)) {
    const error = await sendError(message, {
      description: "This command is already running in this channel"
    })
    if (command.type === "prefix") deleteAfter(error)
    return
  }
  Object.defineProperty(message, "command", {
    value: Object.assign({}, command)
  })
  if (await permCheck(message, command) !== true) return
  if (!await cooldownCheck(message, command)) return
  if (command.requirement && !command.requirement.check(message)) {
    sendError(message, {
      title: "Unable to run command",
      description: typeof command.requirement.error === "function" ? await command.requirement.error(message) : command.requirement.error
    })
    return
  }
  command.toString = () => `${config.prefix}${name}`
  if (!message.member) {
    Object.defineProperty(message, "member", {
      value: createMember(message.author)
    })
  }
  if (command.type !== "prefix") {
    message.aliasUsed = name
  }
  return true
})