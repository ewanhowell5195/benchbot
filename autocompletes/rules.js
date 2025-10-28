registerAutocomplete(scriptName, async (interaction, text) => {
  text = text.toLowerCase()
  const rules = await Promise.all(db.guilds.rules.all(config.guild).map(async (e, i) => ({ name: limit(`${i + 1}: ${await replaceDiscordMentions(await getGuild(config.guild), e[0])}`, 100), value: (i + 1).toString() })))
  if (!text) return interaction.respond(rules)
  interaction.respond(rules.filter(e => e.name.toLowerCase().includes(text)).sort((a, b) => {
    a = a.name.toLowerCase()
    b = b.name.toLowerCase()
    if (a.startsWith(text)) {
      if (b.startsWith(text)) return a.localeCompare(b)
      return -1
    }
    if (b.startsWith(text)) return 1
    return a.localeCompare(b)
  }))
})