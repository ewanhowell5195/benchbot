registerPrefixCommand(scriptName, prefixPath, {
  description: "Edit one of the server rules.",
  guildOnly: true,
  aliases: ["ruleedit"],
  permissions: ["ManageGuild"],
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
    const newRule = []
    const modal = await modalHandler(message, undefined, {
      prompt: {
        description: `Press the button to edit the rule:\n## Rule ${ruleNumber}: ${rule[0]}\n${rule[1]}`,
        button: {
          label: "Edit rule",
          emoji: client.emotes.pencilWhite,
          id: "modal"
        }
      },
      modal: {
        title: "Rule Editor",
        rows: [
          {
            label: "Rule",
            component: component.input({
              id: "rule",
              maxLength: 128,
              placeholder: limit(rule[0], 64),
              required: true
            })
          },
          {
            label: "Rule Description",
            component: component.input({
              id: "description",
              maxLength: 512,
              placeholder: limit(rule[1], 64),
              long: true
            })
          }
        ]
      },
      async onSubmit(fields) {
        newRule.push(await insertDiscordMentions(message.guild, fields.rule))
        if (fields.description) newRule.push(await insertDiscordMentions(message.guild, fields.description))
        return true
      }
    })
    if (modal.timeout) return
    const target = modal.interaction ?? message
    db.guilds.rules.edit(message.guildId, ruleNumber - 1, newRule)
    sendComponents(target, {
      components: [
        component.container(message, [`## Rule updated\nRule \`${ruleNumber}\` has been updated\n\nHere is a preview of the rule:`]),
        component.container(message, [`## Rule ${ruleNumber}: ${newRule[0]}${newRule[1] ? `\n${newRule[1]}` : ""}`])
      ]
    }, modal.message)
  }
})