registerPrefixCommand(scriptName, prefixPath, {
  description: "Remove a server invite.",
  guildOnly: true,
  aliases: ["removeserver", "removeinvite"],
  permissions: ["ManageGuild"],
  arguments: [{
    name: "name",
    description: "The server name",
    required: true,
    autocomplete: "serverInvites"
  }],
  async execute(message, name) {
    const id = name.toLowerCase().replace(/\s/g, "-")
    const invite = db.guilds.serverInvites.getId(config.guild, id)
    if (!invite) return sendError(message, {
      title: "Server invite not found",
      description: `The server invite \`${limit(id.toTitleCase(true))}\` was not found in this server`
    })
    const invites = db.guilds.serverInvites.all(config.guild)
    db.guilds.serverInvites.remove(config.guild, invites.indexOf(invites.find(e => e[0] === id)))
    sendMessage(message, {
      title: "Server invite removed",
      description: `The server invite \`${id.toTitleCase(true)}\` ${invite[1]} has been removed from the server`
    })
  }
})