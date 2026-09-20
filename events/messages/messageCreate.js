registerEvent(scriptName, async message => {
  if (message.author.bot || message.system) return
  if (config.channels.autoban && message.channelId === config.channels.autoban && !isMod(message.member) && message.member.roles.highest.rawPosition < message.guild.members.me.roles.highest.rawPosition) {
    if (hasPerm(message.guild.members.me, "BanMembers")) {
      await compromisedBan(message.member, "[AUTO-BAN] A message was sent to the auto-ban channel")
    } else {
      sendLog({
        icon: client.icons.warningRed,
        type: "Failed to auto-ban member",
        bad: true,
        description: `Failed to auto-ban ${message.member} when they sent a message in the ${message.channel} channel because I do not have the \`Ban Members\` permission`
      })
    }
    return
  }
  if (spamCheck(message)) return
  if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) return sendMessage(message, {
    title: client.user.displayName,
    thumbnail: avatar(client.user),
    description: `My prefix is \`${config.prefix}\`\n\nUse \`${config.prefix}help\` to view the commands that are available\n\nI also support slash commands!`
  })
  if (message.channelId === config.channels.showcase && message.content.toLowerCase().startsWith("[p]")) message.content = `${config.prefix}archive ${message.content.replace(/^[p]\s?/i)}`
  let messageList = message.content.split(/(?<! ) /)
  if ([`<@${client.user.id}>`, `<@!${client.user.id}>`].includes(messageList[0])) {
    messageList[0] = config.prefix + (messageList[1] ?? "")
    messageList.splice(1, 1)
  }
  let command
  const start = messageList[0].toLowerCase()
  if (start.startsWith(config.prefix)) command = start.slice(config.prefix.length).toLowerCase()
  if (!command) return
  let cmd = client.prefixCommands.get(command)
  if (!cmd) {
    const closest = await wrongCommand(command, message).catch(() => {})
    if (!closest) return
    cmd = closest[0]
    message.aliasUsed = closest[1]
  } else message.aliasUsed = command
  runPrefixCommand(cmd, message, messageList.slice(1))
})