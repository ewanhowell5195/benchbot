registerFunction(scriptName, async (message, func, args = {}) => {
  let filterMessage = message
  const interaction = message.interaction ?? message
  if (interaction instanceof Discord.BaseInteraction) {
    filterMessage = await interaction.fetchReply()
  }

  return new Promise(fulfil => {
    args.timeout ??= 60

    const collector = new Discord.InteractionCollector(client, {
      filter: e => e.message?.id === filterMessage.id || e.message?.reference?.messageId === filterMessage.id || e.message?.interaction?.id === filterMessage.id
    })
    args.onCollector?.(collector)

    let state = {
      timeout: true,
      message: interaction.message ?? message,
      messages: []
    }

    let timeout = setTimeout(() => collector.stop(), args.timeout * 1000)

    collector.on("collect", async interaction => {
      if (args.author && interaction.user.id !== args.author.id) {
        return sendPrivateComponents(interaction, "Only the command author can do that")
      }

      if (!args.fixed) {
        clearTimeout(timeout)
        timeout = setTimeout(() => collector.stop(), args.timeout * 1000)
      }

      await func(interaction, collector, state)
    })

    collector.on("end", async e => {
      clearTimeout(timeout)
      if (state.timeout) {
        if (args.delete) {
          deleteMessage(message)
        } else if (args.timeoutMessage) {
          editComponents(state.message, args.timeoutMessage)
        } else if (args.disable !== false) {
          const components = state.message.components
          if (components && disableComponents(components)) {
            editComponents(state.message, { components })
          }
        }
        if (args.disable !== false) {
          for (const m of state.messages) {
            const components = m.components ?? m.message.components
            if (components && disableComponents(components)) {
              editComponents(m, { components })
            }
          }
        }
      }
      fulfil(state)
    })
  })
})