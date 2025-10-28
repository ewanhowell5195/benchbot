registerArgType(scriptName, async (item, data) => {
  if (item instanceof Discord.GuildMember) return item
  item = item.toLowerCase()
  let member
  if (item === "<<" && !data.noText) return createMember(data.message.author)
  if (["<", "me"].includes(item) && !data.noText && data.message.member) return data.message.member
  if (item === "^" && !data.noText) try {
    const messages = Array.from(await getMessages(data.message.channel, { before: data.message.id, limit: 1 }))
    if (messages[0][1].member) return messages[0][1].member
  } catch {}
  try {
    const id = item.replace(/\D+/g, "")
    if (data.message.guild) {
      member = await getMember(data.message.guild, id)
      if (!member) {
        if (!data.noText) try {
          if (item.startsWith("@")) item = item.slice(1)
          const parts = item.match(/(.+?)(#\d{4}$)?$/)
          const members = await data.message.guild.members.search({ query: parts[1] })
          const found = members.find(member => member.user.username.toLowerCase() === item || member.user.globalName.toLowerCase() === item || member.nickname?.toLowerCase() === item)
          if (found) member = found
        } catch {}
      }
    } else {
      let user
      if (id === client.user.id || item === client.user.username || item === client.user.globalName) {
        user = client.user
      } else if (id === data.message.author.id || item === data.message.author.username) {
        user = data.message.author
      }
      if (user) member = createMember(user)
    }
    if (!member) {
      let user
      try {
        user = await client.users.fetch(id)
      } catch {
        if (!data.noText) {
          const ban = (await data.message.guild.bans.fetch()).find(e => e.user.username.toLowerCase() === item)
          if (ban) user = ban.user
        }
      }
      if (user) member = createMember(user)
    }
  } catch {}
  if (!member && !data.errorless) return sendError(data.message, {
    title: "Member not found",
    description: `The member \`${limit(item)}\` could not be found`,
    fetch: true
  })
  return member
})