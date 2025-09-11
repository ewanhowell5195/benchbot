registerFunction(scriptName, (command, message, data) => new Promise(async (fulfil, reject) => {
  const commandList = [...client.fullCommandList]
  let customCommands
  const closest = closestMatch(command, commandList, 0)
  const error = await sendError(message, {
    title: "Incorrect command",
    description: `The command \`${command.limit()}\` doesn't exist.\n\nDid you mean \`${closest}\`?`,
    components: [makeRow({
      buttons: [
        {
          label: "Run",
          customId: "run",
          emoji: client.emotes.tickWhite,
          style: "green"
        },
        {
          label: "Delete",
          customId: "delete",
          emoji: client.emotes.binWhite,
          style: "red"
        },
        {
          label: "Info",
          customId: "info",
          emoji: client.emotes.questionWhite,
          style: "blue"
        }
      ]
    })],
    ephemeral: false,
    fetch: true,
    deletable: false
  })
  const author = message.author || message.user
  await interactionHandler(message.commandName ? message : error, async (interaction, collector) => {
    if (interaction.customId === "info") {
      return client.prefixCommands.get("help").execute(message, [client.prefixCommands.get(closest)], interaction)
    }
    if (interaction.user.id === author.id) {
      if (interaction.customId === "run") {
        await deleteMessage(error)
        fulfil([client.prefixCommands.get(closest), closest, error])
      } else if (interaction.customId === "delete") {
        if (!message.attachments?.size) message.delete?.().catch(() => {})
        deleteMessage(error)
        reject()
      }
    } else sendPrivateMessage(interaction, { description: "Only the command author can do that" })
  }, { destroy: true })
  reject()
}))