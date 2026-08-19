registerPrefixCommand(scriptName, prefixPath, {
  description: [
    "Get a server invite link.",
    "Provide no arguments to view a list of all available arguments."
  ],
  aliases: ["server", "serverinvites", "servers", "invite", "invites"],
  arguments: [{
    name: "name",
    description: "The server name",
    autocomplete: "serverInvites"
  }],
  async execute(message, name) {
    const invites = db.guilds.serverInvites.all(config.guild)
    if (!invites.length) return sendError(message, {
      title: "No server invites",
      description: "There are no server invites set up in this server"
    })
    if (!name) return sendMessage(message, {
      author: ["Server invites", client.icons.discord],
      description: invites.map(e => `[${e[0].toTitleCase(true)}](${e[1]})`).sort().join("\n")
    })
    const id = name.toLowerCase().replace(/\s/g, "-")
    const invite = db.guilds.serverInvites.getId(config.guild, id)
    if (invite) return sendMessage(message, { content: invite[1] })
    const match = closestMatch(name, invites.map(e => e[0]))
    if (!match) return sendError(message, {
      title: "Server invite not found",
      description: `The server invite \`${limit(id.toTitleCase(true))}\` was not found in this server`
    })
    sendMessage(message, { content: invites.find(e => e[0] === match)[1] })
  }
})