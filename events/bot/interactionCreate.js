registerEvent(scriptName, async interaction => {
  if (isType.interaction(interaction, "ApplicationCommand")) {
    Object.defineProperty(interaction, "command", {
      value: undefined,
      configurable: true
    })
    if (isType.command(interaction, "ChatInput")) return runSlashCommand(interaction)
    else return runContextCommand(interaction)
  } else if (isType.interaction(interaction, "ApplicationCommandAutocomplete")) {
    const respond = interaction.respond.bind(interaction)
    interaction.respond = data => respond(data).catch(() => {})
    let command = client.slashCommands.get(interaction.commandName)
    if (!command) {
      return interaction.respond([{ name: "This command no longer exists", value: "unregistered" }])
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
      return interaction.respond([{ name: "This command no longer exists", value: "unregistered" }])
    }
    let name
    for (const option of interaction.options.data) {
      if (option.focused) {
        name = option.name
        break
      } else if (option.options) for (const option2 of option.options) {
        if (option2.focused) {
          name = option2.name
          break
        } else if (option2.options) for (const option3 of option2.options) {
          if (option3.focused) {
            name = option3.name
            break
          }
        }
      }
    }
    const autocomplete = command.arguments?.find(e => e.id === name)?.autocomplete
    if (!autocomplete) return interaction.respond([])
    if (typeof autocomplete === "function") autocomplete(interaction, interaction.options.getFocused().toLowerCase(), interaction.options)
    else if (Array.isArray(autocomplete)) interaction.respond(filteredSort(autocomplete, interaction.options.getFocused().toLowerCase(), 25).map(e => ({ name: e, value: e })))
    else {
      const split = autocomplete.split(":")
      client.autocompletes.get(split[0]).execute(interaction, interaction.options.getFocused().toLowerCase(), interaction.options, split[1])
    }
  } else if (interaction.isButton()) {
    return buttonHandler(interaction)
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "jobs_access_modal") {
      await interaction.member.roles.add(config.roles.jobs)
      sendPrivateMessage(interaction, {
        title: "You now have job channel access",
        description: `The job channels are now available to you:\n\n<#${config.channels.job.artist}>\n<#${config.channels.job.job}>\n<#${config.channels.job.project}>\n<#${config.channels.job.discussion}>\n\nTo create a post in any of these channels, go to <#${config.channels.commands}> and use the ${await getCommandName(interaction, "job", null, "slash")} command.`
      })
    }
  }
})