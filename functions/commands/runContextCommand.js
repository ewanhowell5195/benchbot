registerFunction(scriptName, async interaction => {
  const command = client.contextCommands.get(interaction.commandName)
  if (!command) {
    return sendError(interaction, {
      description: "This command no longer exists"
    })
  }
  if (await preCommand(interaction, command) !== true) return
  interaction.commandRun = interaction.commandName
  let args = []
  if (command.arguments) {
    const modal = {
      title: command.name,
      rows: command.arguments
    }
    await interaction.showModal(makeModal(modal))
    const response = await interaction.awaitModalSubmit({
      time: 300000
    }).catch(e => {
      if (e.message !== "Collector received no interactions before ending with reason: time") console.error(e)
    })
    if (!response) return
    const fields = {}
    const [modal2, errorFields] = await parseModalFields(response, modal, fields)
    if (errorFields.length) return sendPrivateError(response, {
      title: "There were some issues with that input",
      fields: errorFields
    })
    args = Object.values(fields)
    response.command = interaction.command
    response.commandRun = interaction.commandRun
    response.commandName = interaction.commandName
    response.member = interaction.member
    response.targetMessage = interaction.targetMessage
    response.targetId = interaction.targetId
    response.commandType = interaction.commandType
    response.author = interaction.author
    interaction = response
  }
  if (isType.command(interaction, "Message")) {
    interaction.reference = {
      message: interaction.targetMessage,
      channelId: interaction.channelId,
      messageId: interaction.targetId,
      guildId: interaction.guildId
    }
  } else if (isType.command(interaction, "User")) {
    let member
    if (interaction.guild) {
      member = await interaction.guild.members.fetch(interaction.targetId)
    } else {
      member = createMember(await client.users.fetch(interaction.targetId))
    }
    if (!member) return
    args.unshift(member)
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