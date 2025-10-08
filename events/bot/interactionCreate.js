registerEvent(scriptName, async interaction => {
  if (isType.interaction(interaction, "ApplicationCommand")) {
    if (isType.command(interaction, "ChatInput")) return runSlashCommand(interaction)
    else return runContextCommand(interaction)
  } else if (isType.interaction(interaction, "ApplicationCommandAutocomplete")) {
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
    const autocomplete = command.options.find(e => (e.name ?? e.type) === name).autocomplete
    if (typeof autocomplete === "function") autocomplete(interaction, interaction.options.getFocused().toLowerCase(), interaction.options)
    else if (Array.isArray(autocomplete)) interaction.respond(filteredSort(autocomplete, interaction.options.getFocused().toLowerCase(), 25).map(e => ({ name: e, value: e })))
    else {
      const split = autocomplete.split(":")
      client.autocompletes.get(split[0]).execute(interaction, interaction.options.getFocused().toLowerCase(), interaction.options, split[1])
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith("delete_")) {
      if (interaction.user.id === interaction.customId.match(/^delete_(\d+)$/)[1] || hasPerm(interaction.member, "ManageMessages", interaction.channel) || isMod(interaction.member)) {
        deleteMessage(interaction.message)
        if (interaction.message.reference) {
          const message = await getMessage(interaction.channel, interaction.message.reference.messageId)
          if (message && !message.attachments?.size) deleteMessage(message)
        }
        return
      }
      return sendPrivateMessage(interaction, { description: "Only the message author can do that" })
    } else if (interaction.customId === "jobs_access_button") {
      if (interaction.member.roles.cache.has(config.roles.jobs)) {
        return sendPrivateMessage(interaction, {
          description: "You already have access to the job channels"
        })
      }
      interaction.showModal(component.modal("Job Channel Access", [
        component.text("## Warning\nBe cautious when using the Job Channels. They are not moderated or verified by the server team.\n\n## Verification\nAlways confirm that the people you work with are genuine. Check that portfolios belong to them and that clients can prove they can pay.\n\n## Responsibility\nBy clicking submit, you acknowledge that you understand these risks and will take responsibility for verifying anyone you work with.")
      ], "jobs_access_modal"))
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "jobs_access_modal") {
      await interaction.member.roles.add(config.roles.jobs)
      sendPrivateMessage(interaction, {
        title: "You now have job channel access",
        description: `The job channels are now available to you:\n\n<#${config.channels.job.artist}>\n<#${config.channels.job.job}>\n<#${config.channels.job.project}>\n\nTo create a post in any of these channels, go to <#${config.channels.commands}> and use the ${await getCommandName(interaction, "job", null, "slash")} command.`
      })
    }
  }
})