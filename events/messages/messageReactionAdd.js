registerEvent(scriptName, async (reaction, user) => {
  if (user.bot || !reaction.emoji.id) return
  let message
  try {
    message = await reaction.message.fetch()
  } catch {
    return
  }
  if (!message.guild) return
  if (reaction.emoji.id === config.emotes.delete) {
    if (message.channelId === config.channels.archive && message.author.id === client.user.id && message.embeds[0]) {
      const id = message.embeds[0].description.match(/.*\*\*By <@!?(\d+)>\*\*/)
      if (id?.[1] === user.id) deleteMessage(message)
      else reaction.remove()
    }
    if (message.author.id === client.user.id && message.embeds[0] && Object.values(config.channels.job).includes(message.channelId)) {
      const id = message.embeds[0].description.match(/### <@!?(\d+)>/)
      if (id?.[1] === user.id) deleteMessage(message)
      else reaction.remove()
    }
  } else if (reaction.emoji.id === config.emotes.relocate) {
    const users = await reaction.users.fetch()
    if (!users.get(client.user.id) && !message.author.bot && message.author.id !== user.id && Date.now() - message.createdTimestamp <= 86400000) {
      relocate(message, user, message.channel)
      reaction.react()
    }
  } else if (reaction.emoji.id === config.emotes.like && message.channelId === config.channels.archive) {
    await reaction.fetch()
    if (reaction.count >= config.likes.reactions) {
      const author = await getMember(message.guild, message.embeds[0]?.description?.match(/(\d+)>\*\*$/)?.[1])
      if (author && !(author.roles.cache.has(config.roles.modelingPro) || author.roles.cache.has(config.roles.modelingEnthusiast))) {
        db.users.popularPosts.add(author.id, message.id)
        if (db.users.popularPosts.worthy(author.id)) {
          author.roles.add(config.roles.modelingEnthusiast)
          let posts = db.users.popularPosts.get(author.id).slice(0, config.likes.posts).map((e, i) => ({
            label: `Post ${i + 1}`,
            url: `https://discord.com/channels/${message.guildId}/${message.channelId}/${e}`
          }))
          const components = []
          while (posts.length) {
            const buttons = posts.slice(0, 5)
            posts = posts.slice(5)
            components.push(component.row(...buttons.map(e => component.button(e))))
          }
          sendMessage(await getChannel(config.channels.showcase), {
            message: `Congratulations ${author}!`,
            author: ["Role award!", client.icons.medalGreen],
            description: `The community seems to love your models!\n${config.likes.posts} of your posts have each individually received ${config.likes.reactions}+ likes!\nI'm awarding you with the <@&${config.roles.modelingEnthusiast}> role!`,
            components
          })
          sendLog({
            icon: client.icons.medalGreen,
            type: "Modeling Enthusiast role assigned",
            fields: [
              ["Member", `${author} \`${author.id}\``],
              ["Requirement", `${config.likes.posts} x ${config.likes.reactions} likes`]
            ]
          })
        }
      }
    }
  }
})