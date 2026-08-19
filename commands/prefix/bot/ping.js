registerPrefixCommand(scriptName, prefixPath, {
  description: "Check what the bot's latency is.",
  aliases: ["pong"],
  async execute(message, args) {
    const before = Date.now()
    const ping = await sendMessage(message, {
      author: ["Pinging...", client.icons.pinging],
      fields: [
        ["API latency", client.ws.ping === -1 ? "Not calculated yet" : `${Math.round(client.ws.ping)} ms`]
      ],
      fetch: true
    })
    editMessage(ping, {
      author: ["Pong", client.icons.ping],
      fields: [
        ["API latency", client.ws.ping === -1 ? "Not calculated yet" : `${Math.round(client.ws.ping)} ms`],
        ["Bot latency", `${Date.now() - before} ms`]
      ]
    }).catch(() => {})
  }
})