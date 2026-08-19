const pattern = /^https:\/\/discord\.com\/invite\/.*/

registerPrefixCommand(scriptName, prefixPath, {
  description: "Add a new server invite.",
  guildOnly: true,
  aliases: ["addserver", "addinvite"],
  permissions: ["ManageGuild"],
  quotes: true,
  arguments: [
    {
      name: "name",
      description: "The server name",
      maxLength: 24,
      required: true
    },
    {
      name: "invite",
      description: "The invite link",
      required: true,
      rest: false
    }
  ],
  async execute(message, name, invite) {
    const id = name.toLowerCase().replace(/\s+/g, "-").trim()
    if (!invite.match(/^https?:\/\/.*/)) invite = "https://" + invite
    const r = await argTypes.realURL(invite, { message })
    if (r instanceof Discord.Message) return
    else if (!r) return sendArgError(message, invite, "invite", "URL")
    const count = db.guilds.serverInvites.count(config.guild)
    if (count >= 15) return sendError(message, {
      title: "Maximum number of server invites",
      description: "The maximum number of server invites that you can have is `15`"
    })
    const existing = db.guilds.serverInvites.getId(config.guild, id)
    if (existing) return sendError(message, {
      title: "Invite already exists",
      description: `An invite with the name \`${id.toTitleCase(true)}\` already exists with the server invite \`${existing[1]}\``
    })
    const existing2 = db.guilds.serverInvites.getInvite(config.guild, invite)
    if (existing2) return sendError(message, {
      title: "Invite already exists",
      description: `The invite \`${invite}\` already exists with the id \`${existing2[0]}\``
    })
    if (!pattern.test(r[1].url)) return sendError(message, {
      title: "Invalid Discord invite link",
      description: `The link \`${invite}\` is not a valid Discord invite link`
    })
    db.guilds.serverInvites.add(config.guild, [id, invite])
    sendMessage(message, {
      title: "Server invite added",
      description: `The server invite \`${id.toTitleCase(true)}\` ${invite} has been added to the server`
    })
  }
})