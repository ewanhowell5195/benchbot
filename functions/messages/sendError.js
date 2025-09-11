registerFunction(scriptName, {
  async sendError(message, data) {
    if (!message) return
    if (message.command && !data.ignoreCooldown) clearCooldown(message)
    const channel = message.channel ?? message
    data.author = ["Error", client.icons.error]
    data.colour = client.colours.error
    const embed = makeEmbed(message, data)
    if (!(message.command?.application && data.ephemeral !== false) && data.deletable !== false) {
      data.components ??= []
      data.components.push(makeRow({
        buttons: [{
          emoji: client.emotes.binWhite,
          style: "red",
          customId: `delete_${message.author.id}`
        }]
      }))
    }
    if (data.processing) try {
      return await (message.command?.application ? message.editReply.bind(message) : data.processing.edit.bind(data.processing))({
        embeds: [embed],
        components: data.components
      })
    } catch {}
    try {
      return await (message.deferred ? message.editReply.bind(message) : message.reply.bind(message))({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
        components: data.components,
        ephemeral: data.ephemeral === false ? false : true,
        fetchReply: data.fetch
      })
    } catch {
      return channel.send({
        embeds: [embed],
        components: data.components
      })
    }
  },
  sendPrivateError(interaction, data) {
    if (interaction.command && !data.ignoreCooldown) clearCooldown(interaction)
    data.author = ["Error", client.icons.error]
    data.colour = client.colours.error
    return interaction.reply({
      embeds: [makeEmbed(interaction, data)],
      components: data.components,
      ephemeral: true
    })
  },
  sendArgError(message, arg, name, type, data) {
    if (data?.arg instanceof Discord.Message) return
    return sendError(message, {
      title: `Invalid argument type for \`${name.toTitleCase(true)}\``,
      description: `\`${arg.toString().limit()}\` is not a valid \`${type.toTitleCase(true)}\``,
      processing: data?.processing
    })
  },
  sendParentError(message, processing) {
    return sendError(message, {
      title: "Unable to determine parent server",
      description: "Please try again later\n\nPerhaps there is a server outage, or the server no longer exists",
      processing
    })
  }
})