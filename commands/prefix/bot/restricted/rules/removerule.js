registerPrefixCommand(scriptName, prefixPath, {
  description: "Remove a rule from the server rules.",
  guildOnly: true,
  aliases: ["ruleremove"],
  arguments: [{
    type: "number",
    name: "rule",
    description: "The rule number",
    required: true,
    autocomplete: "rules"
  }],
  async execute(message, ruleNumber) {
    if (ruleNumber < 1) return sendError(message, {
      title: "Invalid rule",
      description: "The minimum rule number is `1`"
    })
    const rule = db.guilds.rules.get(message.guildId, ruleNumber - 1)
    if (!rule) return sendError(message, {
      title: "Rule not found",
      description: `Rule \`${ruleNumber}\` was not found`
    })
    const check = await confirm(message, {
      description: `Are you sure you want to remove rule \`${ruleNumber}\`?`,
      danger: true,
      text: "Remove",
      emoji: client.emotes.binWhite,
      embeds: [{
        author: ["Rules", client.icons.logs],
        description: `## Rule ${ruleNumber}: ${rule[0]}\n${rule[1]}`
      }],
      keep: true
    })
    if (!check[0]) return editMessage(check[1], {
      description: "The rule removal has been aborted",
      components: []
    })
    db.guilds.rules.remove(message.guildId, ruleNumber - 1)
    sendMessage(message, {
      title: "Rule removed",
      description: `Rule \`${ruleNumber}\` has been removed from the server`,
      processing: check[1],
      components: []
    })
  }
})