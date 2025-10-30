registerFunction(scriptName, async (message, author, channel) => {
  const content = message.content?.toLowerCase()
  const suggestions = config.relocate.filter(e => e.keywords.some(k => content?.includes(k)))
  const relocate = await sendMessage(message.user ? channel : message, {
    message: message.user ? `${message} please relocate!` : undefined,
    title: "Please relocate to the correct help channel",
    description: "Keeping questions in the relevant channels helps keep the server clean and helps us understand the context of your question.\n\nNot sure which format or help channel to use? Check out the [Quickstart Wizard!](https://blockbench.net/quickstart)",
    components: [makeRow({
      buttons: [{
        label: "Quickstart Wizard!",
        url: "https://blockbench.net/quickstart"
      }]
    })],
    fields: [[`Suggested channel${suggestions.length > 1 ? "s" : ""}`, suggestions.length ? suggestions.map(e => `<#${e.id}>`).join("\n") : `<#${config.channels.help.how}>`]],
    ping: true
  })
  sendLog({
    icon: `https://cdn.discordapp.com/emojis/${config.emotes.relocate}.webp`,
    type: "Message relocated",
    fields: [
      ["Member", `${author} \`${author.id}\``],
      author.id === message.author?.id ? null : ["Target Member", `${message.author ?? message.user} \`${message.author?.id ?? message.user.id}\``],
      ["Channel", channel.toString()]
    ].filter(Boolean),
    components: [makeRow({
      buttons: [{
        label: "Jump to message…",
        url: `https://discord.com/channels/${relocate.guildId}/${relocate.channelId}/${relocate.id}`
      }]
    })]
  })
})