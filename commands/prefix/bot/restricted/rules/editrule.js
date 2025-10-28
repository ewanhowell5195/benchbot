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
    let modalMessage
    if (!message.command.application) {
      modalMessage = await sendMessage(message, {
        description: `Press the button to edit the rule:\n## Rule ${args[0]}: ${rule[0]}\n${rule[1]}`,
        components: [makeRow({
          buttons: [{
            label: "Edit rule",
            emoji: client.emotes.pencilWhite,
            customId: "modal"
          }]
        })]
      })
    }
    const newRule = []
    if (!await modalHandler(message, modalMessage, {
      title: "Rule Editor",
      rows: [
        {
          "text": {
            id: "rule",
            label: "Rule",
            maxLength: 128,
            placeholder: limit(rule[0], 64),
            required: true
          }
        },
        {
          "text": {
            id: "description",
            label: "Rule Description",
            maxLength: 512,
            placeholder: limit(rule[1], 64),
            long: true
          }
        }
      ]
    }, async (fields, interaction, skipped, message) => {
      newRule.push(await insertDiscordMentions(message.guild, fields.rule))
      if (fields.description) newRule.push(await insertDiscordMentions(message.guild, fields.description))
      return true
    }, {
      authorOnly: true,
      leave: true
    })) return
    db.guilds.rules.edit(message.guildId, args[0] - 1, newRule)
    sendMessage(message, {
      embeds: [
        {
          title: "Rule updated",
          description: `Rule \`${args[0]}\` has been updated\n\nHere is a preview of the rule:`
        },
        {
          author: ["Rules", client.icons.logs],
          description: `## Rule ${args[0]}: ${newRule[0]}\n${newRule[1]}`
        }
      ],
      processing: modalMessage,
      components: []
    })
  }
})