registerFunction(scriptName, async (message, command) => {
  const author = message.author ?? message.user
  try {
    if (!message.guild && command.guildOnly) return sendError(message, {
      description: "This command cannot be used in direct messages"
    })
    if (message.guild && command.dmOnly) return sendError(message, {
      description: "This command can only be used in direct messages"
    })
    if (command.type === "prefix") {
      if (message.guild) {
        if (command.slashCommand) {
          if (message.guild) {
            const slashCommand = await getCommand(command.slashCommand, {guild: testMode ? message.guild : undefined})
            if (slashCommand) {
              if (!(await applicationPermChecks(message, slashCommand))) return sendError(message, {
                description: "You do not have the permissions required to run that command"
              })
            } else {
              for (const perm of command.permissions) if (Discord.PermissionsBitField.Flags[perm] && !hasPerm(message.member, perm, message.channel)) return sendError(message, {
                title: "Missing required permissions",
                description: `You need the \`${perm.toTitleCase(true)}\` permission to run that command`
              })
              if (command.permissions.includes("Moderator") && !isMod(message.member)) return sendError(message, {
                title: "Missing required permissions",
                description: "You need to be a moderator to perform this action"
              })
            }
          }
        } else {
          for (const perm of command.permissions) if (Discord.PermissionsBitField.Flags[perm] && !hasPerm(message.member, perm, message.channel)) return sendError(message, {
            title: "Missing required permissions",
            description: `You need the \`${perm.toTitleCase(true)}\` permission to run that command`
          })
          if (command.permissions.includes("Moderator") && !isMod(message.member)) return sendError(message, {
            title: "Missing required permissions",
            description: "You need to be a moderator to perform this action"
          })
        }
      }
      if (command.permissions.includes("BotOwner") && !config.owners.includes(author.id)) return sendError(message, {
        title: "Command restricted",
        description: "Only bot owners can run that command"
      })
    }
  } catch (error) {
    await sendError(message, {
      title: "An error occured while processing that command:",
      description: `\`\`\`${error.message}\`\`\``,
      footer: ["This error has been logged."]
    })
    let title
    if (message.guild) title = `Permission error in \`${message.guild.name}\` \`#${message.channel.name}\``
    else title = `Permission error in DMs with \`${message.author.username}\``
    return await sendMessage(await getChannel(config.channels.errors), {
      title,
      fields: [
        ["Command", `\`${config.prefix}${message.command.name}\``, false],
        message.command.application ? [`Command sent by \`${message.author.username}\``, getFullCommand(message)] : [`Message sent by \`${message.author.username}\``, limit(message.content, 1024)],
        ["Error message", `\`${limit(error.message, 1000)}\``, false],
        ["Stack", `\`\`\`${limit(error.stack.toString(), 1000)}\`\`\``, false]
      ],
      footer: [`ChannelID: ${message.channelId} - UserID: ${message.author.id}`]
    })
  }
  return true
})

async function applicationPermChecks(message, slashCommand) {
  if (hasPerm(message.member, "Administrator")) return true
  const commandPerms = (await message.guild.commands.permissions.fetch({ command: slashCommand.id }).catch(e => []))
  const clientPerms = (await message.guild.commands.permissions.fetch({ command: client.user.id }).catch(e => []))
  do {
    const channel = commandPerms.find(e => e.id === message.channel.id)?.permission
    if (channel === false) return
    if (channel) break
    const allChannelId = (BigInt(message.guildId) - 1n).toString()
    const allChannels = commandPerms.find(e => e.id === allChannelId)?.permission
    if (allChannels === false) return
    if (allChannels) break
    const channelGlobal = clientPerms.find(e => e.id === message.channel.id)?.permission
    if (channelGlobal === false) return
    if (channelGlobal) break
    const allChannelsGlobal = clientPerms.find(e => e.id === allChannelId)?.permission
    if (allChannelsGlobal === false) return
  } while (false)
  do {
    const member = commandPerms.find(e => e.id === message.member.id)?.permission
    if (member === false) return
    if (member) return true
    let everyoneRole = message.guild.roles.cache.find(e => e.name === "@everyone")
    if (!everyoneRole) everyoneRole = await message.guild.roles.fetch().then(e => e.find(e => e.name === "@everyone"))
    const memberRoles = message.member.roles.cache.filter(e => e.id !== everyoneRole.id)
    const roles = commandPerms.filter(e => memberRoles.has(e.id))
    if (roles.length) {
      if (roles.some(e => e.permission === true)) return true
      return
    }
    const everyone = commandPerms.find(e => e.id === everyoneRole.id)?.permission
    if (everyone === false) return
    if (everyone) return true
    const memberGlobal = clientPerms.find(e => e.id === message.member.id)?.permission
    if (memberGlobal === false) return
    if (memberGlobal) break
    const rolesGlobal = clientPerms.filter(e => memberRoles.has(e.id))
    if (rolesGlobal.length) {
      if (rolesGlobal.some(e => e.permission === true)) break
      return
    }
    const everyoneGlobal = clientPerms.find(e => e.id === everyoneRole.id)?.permission
    if (everyoneGlobal === false) return
  } while (false)
  if (slashCommand.defaultMemberPermissions === 0n || !hasPerm(message.member, slashCommand.defaultMemberPermissions, message.channel)) return
  return true
}