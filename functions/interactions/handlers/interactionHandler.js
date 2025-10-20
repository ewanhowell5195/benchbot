registerFunction(scriptName, (message, func, args = {}) => {
  return new Promise(fulfil => {
    args.timeout ??= 60
    let collector
    const filter = e => e.message?.id === message.id || e.message?.reference?.messageId === message.id || e.message?.interaction?.id === message.id
    if (args.destroy || args.fixed) collector = new Discord.InteractionCollector(client, {
      time: args.timeout * 1000,
      filter
    })
    else collector = new Discord.InteractionCollector(client, {
      idle: args.timeout * 1000,
      filter
    })
    let state = {
      use: false,
      timeout: true
    }
    collector.on("collect", interaction => {
      if (args.author && interaction.user.id !== args.author.id) return sendPrivateMessage(interaction, { description: "Only the command author can do that" })
      func(interaction, collector, state)
    })
    collector.on("end", async e => {
      if (args.leave && !state.timeout) {}
      else if (args.delete || args.destroy) message.delete?.().catch(() => {})
      else if (!args.keep) editMessage(message, {
        description: args.timeoutMessage && state.timeout ? args.timeoutMessage : undefined,
        components: []
      }).catch(() => {})
      fulfil()
    })
  })
})