registerFunction(scriptName, async (message, args) => {
  let confirmMessage
  const cv2 = args.cv2 ?? (args.processing && hasFlag.message(args.processing, "IsComponentsV2"))
  const buttons = component.row(
    component.button({
      label: args.text ?? "Confirm",
      id: "yes",
      style: args.danger ? "red" : "green",
      emoji: args.emoji ?? client.emotes.tickWhite
    }),
    component.button({
      label: args.cancel ?? "Cancel",
      emoji: client.emotes.crossWhite,
      id: "no"
    })
  )
  let contents
  let container
  if (cv2) {
    container = component.container(message, {
      colour: args.danger ? parseInt(client.colours.error.replace("#", ""), 16) : undefined,
      components: [
        [
          args.danger ? "## Warning!" : undefined,
          args.title ? (args.danger ? `**${args.title}**` : `## ${args.title}`) : undefined,
          args.description
        ].filter(Boolean).join("\n"),
        ...(args.fields ?? []).map(e => `### ${e[0]}\n${e[1]}`)
      ]
    })
    contents = {
      components: [container, buttons],
      processing: args.processing,
      files: args.files
    }
  } else {
    contents = {
      embeds: [
        makeEmbed(message, {
          title: args.title,
          author: args.danger ? ["Warning!", client.icons.warningRed] : args.author,
          colour: args.danger ? client.colours.error : undefined,
          description: args.description,
          fields: args.fields
        }),
        ...(args.embeds?.map(e => e instanceof Discord.EmbedBuilder ? e : makeEmbed(message, e)) ?? [])
      ],
      components: [buttons],
      processing: args.processing,
      files: args.files
    }
  }
  const author = message.author ?? message.user
  if (args.private) {
    await (cv2 ? sendPrivateComponents : sendPrivateMessage)(message, contents)
    confirmMessage = message.message
    message = args.message
  }
  else confirmMessage = await (cv2 ? sendComponents : sendMessage)(message, contents)
  let timeout = true
  return new Promise(async fulfil => {
    await interactionHandler(confirmMessage, (interaction, collector) => {
      interaction.deferUpdate().catch(() => {})
      timeout = false
      collector.stop()
      if (interaction.customId === "yes") fulfil([true, confirmMessage])
      else fulfil([false, confirmMessage])
    }, {
      author,
      disable: false
    })
    if (!args.keep) {
      if (cv2) editComponents(confirmMessage, {
        components: [container]
      }).catch(() => {})
      else editMessage(confirmMessage, {
        components: []
      }).catch(() => {})
    }
    if (timeout) {
      fulfil([null, confirmMessage])
    }
  })
})