registerPrefixCommand(scriptName, prefixPath, {
  description: "View the server rules.",
  aliases: ["rules"],
  arguments: [{
    type: "number",
    name: "rule",
    description: "The rule number",
    autocomplete: "rules"
  }],
  async execute(message, rule) {
    if (defined(rule)) {
      if (rule < 1) return sendError(message, {
        title: "Invalid rule",
        description: "The minimum rule number is `1`"
      })
      const ruleData = db.guilds.rules.get(config.guild, rule - 1)
      if (!ruleData) return sendError(message, {
        title: "Rule not found",
        description: `Rule \`${rule}\` was not found`
      })
      return sendMessage(message, {
        author: ["Rules", client.icons.logs],
        description: `## Rule ${rule}: ${ruleData[0]}\n${ruleData[1]}`,
        deletable: true
      })
    }
    const rules = db.guilds.rules.all(config.guild)
    if (!rules.length) return sendError(message, {
      title: "No rules",
      description: "There are no rules set up in this server"
    })
    const embeds = []
    let description = ""
    for (const [i, rule] of rules.entries()) {
      const text = `## ${i + 1}: ${rule[0]}${rule[1] ? `\n${rule[1]}` : ""}\n`
      if (description.length + text.length > 4096) {
        embeds.push({ description })
        description = ""
      }
      description += text
    }
    if (description) embeds.push({ description })
    embeds[0].author = ["Rules", client.icons.logs]
    sendMessage(message, {
      embeds,
      deletable: true
    })
  }
})