async function edit(message, content) {
  await preprocessMessage(message, content)
  const interaction = message.interaction ?? message
  if (content.files) {
    for (let i = 0; i < content.files.length; i++) {
      if (!(content.files[i] instanceof Discord.AttachmentBuilder)) {
        content.files[i] = await makeFile(content.files[i])
      }
    }
  }
  if (interaction instanceof Discord.BaseInteraction) {
    content.fetchReply = true
    interaction.message = await interaction.editReply(content)
    return interaction
  }
  return message.edit(content)
}

registerFunction(scriptName, {
  editMessage(message, args) {
    if (!(message instanceof Discord.Message) && !(message instanceof Discord.BaseInteraction)) return
    if (args.content || args.embedless) {
      return edit(message, {
        allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
        content: args.content,
        embeds: [],
        components: args.components,
        files: args.files,
        flags: args.flags
      }).catch(e => {
        if (args.crash) throw e
      })
    }
    if (args.embeds) {
      return edit(message, {
        allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
        content: args.message,
        embeds: args.embeds,
        components: args.components,
        files: args.files,
        flags: args.flags
      }).catch(e => {
        if (args.crash) throw e
      })
    }
    if (args.title || args.description || args.image || args.fields || args.author || args.field || args.url || args.timestamp || args.thumbnail) {
      return edit(message, {
        allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
        content: args.message,
        embeds: [args],
        components: args.components,
        files: args.files,
        flags: args.flags
      }).catch(e => {
        if (args.crash) throw e
      })
    } else {
      return edit(message, {
        allowedMentions: args.allowedMentions ?? (args.ping ? { repliedUser: true, parse: ["users", "roles"] } : { parse: ["users"] }),
        content: args.message,
        components: args.components,
        files: args.files,
        flags: args.flags
      }).catch(e => {
        if (args.crash) throw e
      })
    }
  },
  async editPrivateMessage(interaction, args) {
    await preprocessMessage(interaction, args)
    let sent
    if (args.embedless || args.content) {
      sent = await interaction.editReply({
        content: args.content,
        embeds: [],
        components: args.components,
        files: args.files,
        flags: args.flags,
        ephemeral: true,
        fetchReply: true
      }).catch(e => {
        if (args.crash) throw e
      })
    } else if (args.embeds) {
      sent = await interaction.editReply({
        embeds: args.embeds,
        components: args.components,
        files: args.files,
        flags: args.flags,
        ephemeral: true,
        fetchReply: true
      }).catch(e => {
        if (args.crash) throw e
      })
    } else {
      sent = await interaction.editReply({
        embeds: [makeEmbed(interaction, args)],
        components: args.components,
        files: args.files,
        flags: args.flags,
        ephemeral: true,
        fetchReply: true
      }).catch(e => {
        if (args.crash) throw e
      })
    }
    interaction.message = sent
    return interaction
  }
})