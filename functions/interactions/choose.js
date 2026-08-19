registerFunction(scriptName, async (message, args) => {
  let components = []
  if (args.select) {
    components.push(component.row(
      component.select({
        placeholder: args.placeholder,
        options: args.options.map((e, i) => ({
          label: e[0],
          description: e[1],
          value: i.toString()
        }))
      })
    ))
  } else {
    const buttons = []
    if (args.emoji) {
      for (let x = 0; x < args.options.length; x++) {
        buttons.push(component.button({
          emoji: args.options[x],
          id: x.toString()
        }))
      }
    } else {
      for (let x = 0; x < args.options.length; x++) {
        if (!args.options[x]) continue
        if (typeof args.options[x] === "string") {
          buttons.push(component.button({
            label: args.options[x],
            id: x.toString()
          }))
        } else {
          buttons.push(component.button({
            label: args.options[x].label,
            emoji: args.options[x].emoji,
            style: args.options[x].style,
            id: x.toString()
          }))
        }
      }
    }
    for (let x = 0; x < buttons.length; x++) {
      if (x % 5 === 0) components.push([])
      components[Math.floor(x / 5)].push(buttons[x])
    }
    components = components.map(e => component.row(...e))
  }
  const cv2 = args.cv2 ?? (args.message && hasFlag.message(args.message, "IsComponentsV2"))
  let optionMessage
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
    optionMessage = await sendComponents(message, {
      components: [container, ...components],
      processing: args.message
    })
  } else {
    optionMessage = await sendMessage(message, {
      author: args.danger ? ["Warning!", client.icons.warningRed] : args.author,
      colour: args.danger ? client.colours.error : undefined,
      title: args.title,
      description: args.description,
      components,
      processing: args.message,
      fields: args.fields
    })
  }
  let timeout = true
  return new Promise(async fulfil => {
    await interactionHandler(optionMessage, (interaction, collector) => {
      interaction.deferUpdate()
      timeout = false
      collector.stop()
      fulfil([interaction.values?.[0] ?? interaction.customId, optionMessage])
    }, {
      author: message.author,
      disable: false
    })
    if (args.reprocess) sendProcessing(optionMessage, optionMessage)
    if (timeout) {
      if (!args.keep) {
        if (cv2) editComponents(optionMessage, "The command timed out…").catch(() => {})
        else editMessage(optionMessage, {
          description: "The command timed out…",
          components: []
        }).catch(() => {})
      }
      fulfil([null, optionMessage])
    } else if (!args.reprocess && !args.keep) {
      if (cv2) editComponents(optionMessage, {
        components: [container]
      }).catch(() => {})
      else editMessage(optionMessage, {
        components: []
      }).catch(() => {})
    }
  })
})