registerFunction(scriptName, message => {
  if (!message.guild || isMod(message.member)) return
  const content = message.content.toLowerCase()

  function handleSpam(args) {
    deleteMessage(message)
    if (message.member) {
      message.member.kick(args.type)
    }
    args.icon = client.icons.warningRed
    args.bad = true
    args.fields = [
      ["Member", message.member ? `${message.member} \`${message.member.id}\`` : "Unknown member"],
      ["Channel", message.channel.toString()],
      ["Message content", `\`\`\`${content.limit(1018).replace(/`/g, "'")}\`\`\``]
    ]
    args.footer = [`The message has been deleted${message.member ? ` and the member has been kicked` : ""}`]
    sendLog(args)
    return true
  }

  // Nitro scam
  if (
    content.match(/https?:\/\//) &&
    (
      content.match(/ni(t|Т)r(o|0)/) || content.match(/d.*\.gift\//)
    ) &&
    !content.includes(".epicgames.com/") &&
    !content.includes(".discord.com/") &&
    !content.includes(".nitrocdn.com/")
  ) return handleSpam({
    type: "Discord Nitro spam",
    description: "Tried to spam free nitro"
  })

  // Steam gift scam
  if (
    content.length > 30 && content.length < 180 &&
    (
      content.match(/(\$ gift|gift .*\$).{1,10}http(s)?:\/\/[\w\/\.]+$/i) ||
      (content.match(/http(s)?:\/\/.+\.ru\//i) && content.match(/nitro/i))
    )
  ) return handleSpam({
    type: "Steam gift scam",
    description: "Tried to spam steam gift code scams"
  })

  if (content.length > 550 && [3, 4, 5].includes(content.match(/https:\/\/media\.discordapp\.net\/attachments\/.+\?/g)?.length) && content.startsWith('https://media')) {
    let no_link_message = content.replace(/https:\/\/media\.discordapp\.net\/attachments\/[^\s]+/g, '').replace('@everyone', '');
    if (no_link_message.length < 6 && !(message.member?.roles?.color)) {
      return handleSpam({
        type: "Image link spam",
        description: "Tried to spam multiple images in one message with no context"
      })
    }
  }

  // General russian bots
  if (
    content.length > 30 && content.length < 180 &&
    content.match(/[А-Яа-я ]{10,}/) &&
    content.match(/http(s)?:\/\/.+\.ru\//i) &&
    !content.match(/blockbench/i) &&
    !content.match(/minecraft/i)
  ) return handleSpam({
    type: "Scam link",
    description: "Tried to spam scam links with .ru domain"
  })

  // Everyone ping
  if (content.includes("@everyone")) return handleSpam({
    type: "Pinged everyone",
    description: "Tried to ping everyone"
  })

  // Game test spam
  // if (
  //   content.match(/https?:\/\//) &&
  //   content.includes("game") &&
  //   content.match(/play|test/) &&
  //   content.includes(" ") &&
  //   content.length < 250 &&
  //   !content.includes("map") &&
  //   !content.includes("minecraft") &&
  //   !content.includes("blockbench")
  // ) return handleSpam({
  //   type: "Game test spam",
  //   description: "Likely game-test spam with a malicious link"
  // })

  // Invite spam
  if (
    content.match(/discord\.(?:gg|com\/invite)\/\w+/) &&
    (
      message.channelId === config.channels.introductions ||
      content.match(/nudes|family|sex|tiktok|nsfw|18/)
    )
  ) return handleSpam({
    type: "Invite spam",
    description: "Posted an invite that was likely spam"
  })

  // Suspicious Telegram link
  if (content.match(/\/\/t\.me\/\w+/)) return handleSpam({
    type: "Suspicious Telegram link",
    description: "Posted a suspicious Telegram link"
  })

  // Snowstorm
  if (message.channelId === config.channels.snowstorm && content.match(/what.{2,6}snowstorm.{0,5}$/)) {
    sendMessage(message, { content: "Read the channel description", ping: true })
    return true
  }

  // Moderator ping
  if (content.includes(`<@&${config.roles.moderator}>`)) {
    sendLog({
      icon: client.icons.warningRed,
      type: "Moderator Ping",
      bad: true,
      fields: [
        ["Member", `${message.member} \`${message.member.id}\``],
        ["Channel", message.channel.toString()]
      ],
      components: [makeRow({
        buttons: [{
          label: "Jump to message…",
          url: `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`
        }]
      })]
    })
    return
  }
})