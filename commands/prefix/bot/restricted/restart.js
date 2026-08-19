registerPrefixCommand(scriptName, prefixPath, {
  description: "Restart the bot.",
  permissions: ["BotOwner"],
  async execute(message, args) {
    const msg = await sendMessage(message, {
      author: ["Restarting bot...", client.icons.pinging]
    })
    client.destroy()
    fs.writeFileSync(`./restart.json`, JSON.stringify([msg.channelId, msg.id]), "utf8")
    process.exit()
  }
})