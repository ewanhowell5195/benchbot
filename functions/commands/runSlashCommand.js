const preHandled = ["number", "integer", "boolean", "channel", "role", "attachment"]

registerFunction(scriptName, async interaction => {
  let command = client.slashCommands.get(interaction.commandName)
  if (!command) {
    return sendError(interaction, {
      description: "This command no longer exists"
    })
  }
  let subCommand
  if (!command.execute) {
    subCommand = interaction.options.getSubcommandGroup() ?? interaction.options.getSubcommand()
    command = command.get(subCommand)
    if (!command?.execute) {
      subCommand = interaction.options.getSubcommand()
      command = command?.get(subCommand)
    }
  }
  if (!command) {
    return sendError(interaction, {
      description: "This command no longer exists"
    })
  }
  if (await preCommand(interaction, command) !== true) return
  interaction.commandRun = `/${command.tree.join(" ")}`
  const args = []
  if (command.arguments) {
    for (const [i, argument] of command.arguments.entries()) {
      const name = argument.id
      let result
      if (argument.type === "member") {
        result = interaction.options.getMember(name)
        if (!result) {
          result = interaction.options.getUser(name)
          if (result) result = createMember(result)
        }
      }
      else if (argument.type === "number") result = interaction.options.getNumber(name)
      else if (argument.type === "integer") result = interaction.options.getInteger(name)
      else if (argument.type === "boolean") result = interaction.options.getBoolean(name)
      else if (argument.type === "channel") result = interaction.options.getChannel(name)
      else if (argument.type === "attachment") result = interaction.options.getAttachment(name)
      else if (argument.type === "role") {
        const role = interaction.options.getRole(name)
        if (role?.id === interaction.guildId) return sendError(interaction, {
          title: "Invalid role",
          description: "You cannot use the @everyone role"
        })
        result = role
      }
      else {
        result = interaction.options.getString(name)
        if (result) {
          result = await argTypes.string(result, { message: interaction }, argument)
          if (isMessageResponse(result)) return
        }
      }
      if (result === null && defined(argument.default)) result = argument.default
      if (result !== null && argument.type !== "string") {
        if (preHandled.includes(argument.type)) {
          if (argTypes[argument.type]) {
            const valid = await argTypes[argument.type].validate(result, {
              message: interaction
            }, argument)
            if (valid !== true) return
          }
        } else {
          const old = result
          result = await argTypes[argument.type](result, {
            message: interaction,
            unicode: true
          }, argument)
          if (Array.isArray(result)) {
            result = result[0]
          }
          if (isMessageResponse(result) || result === null) return
          else if (result === undefined) return sendError(interaction, {
            title: `Invalid argument type for ${name.quote()}`,
            description: `${limit(old).quote()} is not a valid ${argTypes[argument.type].displayName.quote()}`
          })
        }
      }
      args.push(result)
    }
  }
  if (command.singleUse) {
    client.commandInstances[command.command] ??= []
    client.commandInstances[command.command].push(interaction.channelId)
  }
  if (testMode) {
    await command.execute(interaction, ...args)
  } else {
    try {
      await command.execute(interaction, ...args)
    } catch (err) {
      return commandError(interaction, err)
    }
  }
  postCommand(interaction)
})