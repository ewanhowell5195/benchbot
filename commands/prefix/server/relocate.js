registerPrefixCommand(scriptName, prefixPath, {
  description: [
    "Tell someone to relocate to a help channel!",
    "Reply to a message to target that message.",
    "If a member is provided, you can provide a keyword to target a specific help channel."
  ],
  guildOnly: true,
  aliases: ["wrongchannel"],
  arguments: [
    {
      name: "memberOrMessageURL",
      description: "The member or message URL to relocate"
    },
    {
      name: "keywords",
      description: "A keyword to target a specific help channel",
      rest: true,
      hidden: true
    }
  ],
  async execute(message, target, keywords) {
    const oldMessage = message
    let member
    if (!target && !message.reference) {
      message.content = ""
    } else {
      if (target) {
        member = await argTypes.member(target, { message, errorless: true })
        if (member) {
          member.content = keywords
        } else {
          const urlMatch = target.match(/discord\.com\/channels\/(\d{17,19})\/(\d{17,19})\/(\d{17,19})?(?:[^\d]|$)/)
          if (!urlMatch?.length) return sendError(message, {
            title: "Invalid member or message link",
            description: `\`${limit(target)}\` is not a valid member or message link`
          })
          if (message.channel.id !== urlMatch[2]) return sendError(message, {
            title: "Unable to relocate",
            description: "You cannot relocate a message from another channel"
          })
          message = await getMessage(message.channel, urlMatch[3])
        }
      } else {
        message = await getMessage(message.channel, message.reference.messageId)
      }
      if (member) {
        if (oldMessage.author.id === member.id) return sendError(oldMessage,{
          title: "Unable to relocate",
          description: "You cannot relocate yourself"
        })
        if (member.user.bot) return sendError(oldMessage, {
          title: "Unable to relocate",
          description: "You cannot relocate bots"
        })
        if (!member.guild) return sendError(oldMessage, {
          title: "Unable to relocate",
          description: "You can only relocate members in this server"
        })
      } else {
        await message.fetch()
        if (oldMessage.author.id === message.author.id) return sendError(oldMessage,{
          title: "Unable to relocate",
          description: "You cannot relocate yourself"
        })
        if (message.author.bot) return sendError(oldMessage, {
          title: "Unable to relocate",
          description: "You cannot relocate bots"
        })
        if (message.createdTimestamp && Date.now() - message.createdTimestamp >= 86400000) return sendError(oldMessage,{
          title: "Unable to relocate",
          description: "You cannot relocate messages that are over a day old"
        })
      }
    }
    if (message.reactions) {
      const reactions = message.reactions.cache
      const reaction = await message.reactions.cache.get(config.emotes.relocate)
      if (reaction) {
        const users = await reaction.users.fetch()
        if (users.get(client.user.id)) return sendError(oldMessage, {
          title: "Message already relocated",
          description: "That message has already been relocated"
        })
      }
    }
    if (oldMessage.command.application && (target || oldMessage.reference)) sendMessage(oldMessage, {
      ephemeral: true,
      description: "Message relocated..."
    })
    if ((target || oldMessage.reference) && !member) react(message, config.emotes.relocate)
    relocate(member ?? message, oldMessage.author, message.channel)
  }
})