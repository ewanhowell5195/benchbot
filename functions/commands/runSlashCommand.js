registerFunction(scriptName, async interaction => {
  interaction.author = interaction.user
  let command = client.slashCommands.get(interaction.commandName)
  let subCommand
  if (!command.execute) {
    subCommand = interaction.options.getSubcommandGroup() ?? interaction.options.getSubcommand()
    command = command.get(subCommand)
    if (!command.execute) {
      subCommand = interaction.options.getSubcommand()
      command = command.get(subCommand)
    }
  }
  const commandName = command.command
  Object.defineProperty(interaction, "command", {
    get: () => command
  })
  interaction.aliasUsed = command.command
  if (await permCheck(interaction, command) !== true) return
  if (!await cooldownCheck(interaction, command)) return
  if (!interaction.member) interaction.member = createMember(interaction.user)
  interaction.commandRun = `/${command.tree.join(" ")}`
  const args = []
  if (command.options) for (const arg of command.options) {
    const name = arg.name ?? arg.type
    let input
    if (arg.type === "user") input = await optionToMember(interaction, name)
    else if (arg.type === "member") {
      const member = await optionToMember(interaction, name, {userless: true})
      if (member === false) return
      input = member
    } 
    else if (arg.type === "number") input = interaction.options.getNumber(name)
    else if (arg.type === "integer") input = interaction.options.getInteger(name)
    else if (arg.type === "boolean") input = interaction.options.getBoolean(name)
    else if (arg.type === "channel") input = interaction.options.getChannel(name)
    else if (arg.type === "role") {
      const role = interaction.options.getRole(name)
      if (role?.id === interaction.guildId) return sendError(interaction, {
        title: "Invalid role",
        description: "You cannot use the @everyone role"
      })
      input = role
    }
    else if (arg.type === "attachment") {
      input = interaction.options.getAttachment(name)
      if (!interaction.attachments) interaction.attachments = new Discord.Collection
      if (input) interaction.attachments.set(input.id, input)
      continue
    }
    else if (arg.type === "image") {
      const attachment = interaction.options.getAttachment(`${name}-attachment`)
      if (attachment) input = attachment.attachment
      else if (!arg.attachmentOnly) input = interaction.options.getString(`${name}-string`)
    }
    else if (arg.type === "string" || !args.type) input = interaction.options.getString(name)
    if (input !== null) {
      if (arg.func) input = arg.func(input)
      if (arg.argType) {
        const argument = input
        input = await argTypes[arg.argType](input, {
          message: interaction,
          unicode: true
        })
        if (input instanceof Discord.Message || input === false) return
        else if (input === undefined) return sendError(interaction, {
          title: `Invalid argument type for \`${name}\``,
          description: `\`${limit(argument)}\` is not a valid \`${arg.argType.toTitleCase(true)}\``
        })
      }
    } else if (arg.default) input = arg.default
    args.push(input)
  }
  if (testMode) await command.execute(interaction, ...args)
  else try {
    await command.execute(interaction, ...args)
  } catch(error) {
    return commandError(interaction, error)
  }
})