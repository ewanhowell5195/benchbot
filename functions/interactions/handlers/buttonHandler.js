registerFunction(scriptName, async interaction => {
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
  }
  if (interaction.customId === "jobs_access_button") {
    if (interaction.member.roles.cache.has(config.roles.jobs)) {
      return sendPrivateMessage(interaction, {
        description: "You already have access to the job channels"
      })
    }
    interaction.showModal(component.modal("Job Channel Access", [
      component.text("## Warning\nBe cautious when using the Job Channels. They are not moderated or verified by the server team.\n\n## Verification\nAlways confirm that the people you work with are genuine. Check that portfolios belong to them and that clients can prove they can pay.\n\n## Responsibility\nBy clicking submit, you acknowledge that you understand these risks and will take responsibility for verifying anyone you work with.")
    ], "jobs_access_modal"))
  }
})