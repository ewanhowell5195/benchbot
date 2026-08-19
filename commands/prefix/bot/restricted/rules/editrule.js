registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Edit one of the server rules.",
    arguments: "[rule]"
  },
  guildOnly: true,
  aliases: ["ruleedit"],
  permissions: ["ManageGuild"],
  arguments: ["rule:number"],
  async execute(message, args) {
    if (args[0] < 1) return sendError(message, {
      title: "Invalid rule",
      description: "The minimum rule number is `1`"
    })
    const rule = db.guilds.rules.get(message.guildId, args[0] - 1)
    if (!rule) return sendError(message, {
      title: "Rule not found",
      description: `Rule \`${args[0]}\` was not found`
    })
    const newRule = []
    const modal = await modalHandler(message, undefined, {
      prompt: {
        description: `Press the button to edit the rule:\n## Rule ${args[0]}: ${rule[0]}\n${rule[1]}`,
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
    db.guilds.rules.edit(message.guildId, args[0] - 1, newRule)
    sendComponents(target, {
      components: [
        component.container(message, [`## Rule updated\nRule \`${args[0]}\` has been updated\n\nHere is a preview of the rule:`]),
        component.container(message, [`## Rule ${args[0]}: ${newRule[0]}${newRule[1] ? `\n${newRule[1]}` : ""}`])
      ]
    }, modal.message)
  }
})