async function send(message, channel, processing, content) {
  await preprocessMessage(message, content)
  if (processing instanceof Discord.BaseInteraction) processing = processing.message
  const interaction = message.interaction ?? message
  let deliveryError
  if (interaction instanceof Discord.BaseInteraction) {
    let sent
    try {
      content.fetchReply = true
      if (interaction.replied || interaction.deferred) {
        sent = await interaction.editReply(content)
      } else {
        sent = await interaction.reply(content)
      }
      interaction.message = sent
      return interaction
    } catch (err) {
      try {
        if (isType.error(err, "MessageWasBlockedByAutomaticModeration")) {
          const embed = makeEmbed(message, {
            title: "Response blocked by AutoMod",
            description: "The response was blocked by AutoMod and could not be sent"
          })
          if (interaction.replied || interaction.deferred) {
            sent = await interaction.editReply({ embeds: [embed] })
          } else {
            sent = await interaction.reply({ embeds: [embed] })
          }
          interaction.message = sent
          return interaction
        }
      } catch (err) {
        if (isType.error(err, "MessageWasBlockedByAutomaticModeration")) return interaction
      }
      deliveryError = err
    }
    if (processing instanceof Discord.Message) {
      try {
        return await processing.edit(content)
      } catch {}
    }
  } else {
    if (processing instanceof Discord.Message) {
      try {
        return await processing.edit(content)
      } catch {}
    }
    try {
      return await message.reply(content)
    } catch (err) {
      deliveryError = err
    }
  }
  if (typeof channel.send !== "function" || message.guildId && !channel.guild) {
    throw deliveryError ?? new Error(`Unable to send message as the channel is not accessible (${channel.constructor?.name ?? typeof channel}${channel.id ? ` ${channel.id}` : ""}${message.guildId ? `, guild ${message.guildId}` : ""})`)
  }
  return await channel.send(content)
}

registerFunction(scriptName, {
  async sendMessage(message, args) {
    if (!message) return
    const origin = new Error().stack
    try {
      const channel = message.channel ?? message
      if (channel.archived && channel.locked && !hasPerm(channel.guild.members.me, "ManageThreads", channel)) {
        if (args.error) sendError(args.error, {
          title: "Unable to send message",
          description: `The channel ${channel} is both archived and locked`
        })
        return
      }
      if (args.deletable && !(message.command?.application && args.ephemeral)) {
        args.components ??= []
        if (!Array.isArray(args.components)) args.components = [args.components]
        args.components.push(component.row(component.button({
          emoji: client.emotes.binWhite,
          style: "red",
          id: `delete_${message.author.id}`
        })))
      }
      if (args.content || args.embedless) {
        return await send(message, channel, args.processing, {
          allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
          content: args.content,
          files: args.files,
          components: args.components,
          embeds: [],
          ephemeral: args.ephemeral,
          flags: args.flags
        })
      }
      if (args.embeds) {
        return await send(message, channel, args.processing, {
          allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
          content: args.message,
          embeds: args.embeds,
          files: args.files,
          components: args.components,
          ephemeral: args.ephemeral,
          flags: args.flags
        })
      }
      return await send(message, channel, args.processing, {
        allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
        content: args.message,
        embeds: [args],
        files: args.files,
        components: args.components,
        ephemeral: args.ephemeral,
        flags: args.flags
      })
    } catch (err) {
      if (err && typeof err === "object") err.origin = origin
      throw err
    }
  },
  async sendPrivateMessage(interaction, args) {
    const origin = new Error().stack
    try {
      await preprocessMessage(interaction, args)
      let sent
      if (args.embedless || args.content) {
        sent = await interaction.reply({
          content: args.content,
          embeds: [],
          components: args.components,
          files: args.files,
          flags: args.flags,
          ephemeral: true,
          fetchReply: true
        })
      } else if (args.embeds) {
        sent = await interaction.reply({
          embeds: args.embeds,
          components: args.components,
          files: args.files,
          flags: args.flags,
          ephemeral: true,
          fetchReply: true
        })
      } else {
        sent = await interaction.reply({
          embeds: [makeEmbed(interaction, args)],
          components: args.components,
          files: args.files,
          flags: args.flags,
          ephemeral: true,
          fetchReply: true
        })
      }
      interaction.message = sent
      return interaction
    } catch (err) {
      if (err && typeof err === "object") err.origin = origin
      throw err
    }
  }
})