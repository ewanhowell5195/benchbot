async function getSlash(message, command, args) {
  const id = await getCommand(command, { guild: testMode ? message.guild : undefined, id: true })
  if (id) {
    if (args) {
      return `</${command.tree.join(" ")}:${id}> \`${args}\``
    }
    return `</${command.tree.join(" ")}:${id}>`
  }
  if (args) {
    return `\`/${command.tree.join(" ")} ${args}\``
  }
  return `\`/${command.tree.join(" ")}\``
}

registerFunction(scriptName, (message, command, args, forceType) => {
  if (command) {
    const prefixCommand = client.prefixCommands.get(command)
    let slashCommand = prefixCommand?.slashCommand
    if (!slashCommand && Array.isArray(command)) {
      slashCommand = command.reduce((cmd, key) => cmd.get(key), client.slashCommands)
    } else if (!slashCommand) {
      slashCommand = client.slashCommands.get(command)
    }
    if (forceType === "slash" || message.command?.application && forceType !== "prefix") {
      return getSlash(message, slashCommand, args)
    }
    if (args) {
      return `\`${config.prefix}${prefixCommand.name} ${args}\``
    }
    return `\`${config.prefix}${prefixCommand.name}\``
  } else {
    if (forceType === "slash" || message.command?.application && forceType !== "prefix") {
      return getSlash(message, message.command, args)
    }
    if (args) {
      return `\`${config.prefix}${message.command.name} ${args}\``
    }
    return `\`${config.prefix}${message.command.name}\``
  }
})