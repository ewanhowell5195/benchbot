registerFunction(scriptName, (command, message, data) => new Promise(async (fulfil, reject) => {
  const commandList = [...client.fullCommandList]
  let customCommands
  const closest = closestMatch(command, commandList, 0)
  const error = await sendError(message, {
    title: "Incorrect command",
    description: `The command \`${limit(command)}\` doesn't exist.\n\nDid you mean \`${closest}\`?`,
    components: [component.row(
      component.button({
        label: "Run",
        id: "run",
        emoji: client.emotes.tickWhite,
        style: "green"
      }),
      component.button({
        label: "Delete",
        id: "delete",
        emoji: client.emotes.binWhite,
        style: "red"
      }),
      component.button({
        label: "Info",
        id: "info",
        emoji: client.emotes.questionWhite,
        style: "blue"
      })
    )],
    ephemeral: false,
    fetch: true,
    deletable: false
  })
  const author = message.author || message.user
  await interactionHandler(message.commandName ? message : error, async (interaction, collector) => {
    if (interaction.customId === "info") {
      return client.prefixCommands.get("help").execute(message, client.prefixCommands.get(closest), interaction)
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
  }, { fixed: true, delete: true })
  reject()
}))