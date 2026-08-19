registerFunction(scriptName, {
  async sendError(message, data) {
    if (!message) return
    const origin = new Error().stack
    try {
      if (message.command && !data.ignoreCooldown) clearCooldown(message)
      const channel = message.channel ?? message

      data.author = ["Error", client.icons.error]
      data.colour = client.colours.error
      const embed = makeEmbed(message, data)

      if (!(message.command?.application && data.ephemeral !== false) && data.deletable !== false) {
        data.components ??= []
        data.components.push(component.row(component.button({
          emoji: client.emotes.binWhite,
          style: "red",
          id: `delete_${message.author.id}`
        })))
      }

      const interaction = message.interaction ?? message
      let deliveryError
      if (interaction instanceof Discord.BaseInteraction) {
        try {
          let sent
          if (interaction.replied || interaction.deferred) {
            sent = await interaction.editReply({
              allowedMentions: {},
              embeds: [embed],
              components: data.components,
              fetchReply: true,
              content: ""
            })
          } else {
            sent = await interaction.reply({
              allowedMentions: {},
              embeds: [embed],
              components: data.components,
              ephemeral: data.ephemeral === false ? false : true,
              fetchReply: true
            })
          }
          interaction.message = sent
          return interaction
        } catch (err) {
          deliveryError = err
        }
      } else {
        if (data.processing instanceof Discord.Message) {
          try {
            return await data.processing.edit({
              allowedMentions: {},
              embeds: [embed],
              components: data.components,
              content: ""
            })
          } catch {}
        }
        try {
          return await message.reply({
            allowedMentions: {},
            embeds: [embed],
            components: data.components
          })
        } catch (err) {
          deliveryError = err
        }
      }
      if (typeof channel.send !== "function" || message.guildId && !channel.guild) {
        throw deliveryError ?? new Error(`Unable to send error message as the channel is not accessible (${channel.constructor?.name ?? typeof channel}${channel.id ? ` ${channel.id}` : ""}${message.guildId ? `, guild ${message.guildId}` : ""})`)
      }
      return await channel.send({
        embeds: [embed],
        components: data.components
      })
    } catch (err) {
      if (err && typeof err === "object") err.origin = origin
      throw err
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
      description: `\`${limit(arg.toString())}\` is not a valid \`${type.toTitleCase(true)}\``,
      processing: data?.processing
    })
  }
})