registerFunction(scriptName, async (command, message, args) => {
  if (command.name !== "help" && args.length === 1 && args[0].toLowerCase() === "help") {
    args[0] = command.name
    command = client.prefixCommands.get("help")
  } else if (command.name !== "help" && args.length === 1 && args[0].toLowerCase().match(/^["“”]help["“”]$/)) args[0] = "help"
  message.command = command
  if (await permCheck(message, command) !== true) return
  if (!await cooldownCheck(message, command)) return
  if (!message.member) Object.defineProperty(message, "member", {
    get: () => createMember(message.author)
  })
  if (!command.typingless) await message.channel.sendTyping().catch(() => {})
  if (command.arguments) for (const [i, arg] of command.arguments.entries()) {
    const argSplit = arg.split(":")
    if (!arg.includes("?") && !args[i]) return sendError(message, {
      title: "Missing required argument",
      description: `Please enter: \`${argSplit[0].replace(/\?|\*/g, "").toTitleCase(true)}\``
    })
    let stop = false
    if (arg.includes("*")) {
      stop = true
      if (args[i]) args = [].concat(args.slice(0, i), args.slice(i, args.length).join(" "))
    }
    const argument = args[i]
    if (~arg.indexOf(":") && argument) {
      args[i] = await argTypes[argSplit[1]](argument, {
        message,
        unicode: true
      })
      if (args[i] instanceof Discord.Message || args[i] === false) return
      else if (args[i] === undefined) return sendError(message, {
        title: `Invalid argument type for \`${argSplit[0].replace(/\?|\*/g, "")}\``,
        description: `\`${limit(argument)}\` is not a valid \`${argSplit[1].toTitleCase(true)}\``
      })
    }
    if (stop) break
  }
  if (testMode) await command.execute(message, args)
  else try {
    await command.execute(message, args)
  } catch(error) {
    return commandError(message, error)
  }
})