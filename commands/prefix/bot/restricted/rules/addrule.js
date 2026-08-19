registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Add a new rule to the server rules."
  },
  guildOnly: true,
  aliases: ["ruleadd"],
  permissions: ["ManageGuild"],
  async execute(message, args) {
    const count = db.guilds.rules.count(message.guildId)
    if (count >= 15) return sendError(message, {
      title: "Maximum number of rules",
      description: "The maximum number of rules that you can have is `15`"
    })
    const rule = []
    const modal = await modalHandler(message, undefined, {
      prompt: {
        description: "Press the button to add a new rule",
        button: {
          label: "Add rule",
          emoji: client.emotes.pencilWhite,
          id: "modal"
        }
      },
      modal: {
        title: "Rule Creator",
        rows: [
          {
            label: "Rule",
            component: component.input({
              id: "rule",
              maxLength: 128,
              placeholder: "No breaking the rules!",
              required: true
            })
          },
          {
            label: "Rule Description",
            component: component.input({
              id: "description",
              maxLength: 256,
              placeholder: "Do not break the rules or you will be banned.",
              long: true
            })
          }
        ]
      },
      async onSubmit(fields) {
        rule.push(await insertDiscordMentions(message.guild, fields.rule))
        if (fields.description) rule.push(await insertDiscordMentions(message.guild, fields.description))
        return true
      }
    })
    if (modal.timeout) return
    const target = modal.interaction ?? message
    db.guilds.rules.add(message.guildId, rule)
    sendComponents(target, {
      components: [
        component.container(message, ["## Rule added\nThe rule has been added to the server\n\nHere is a preview of the rule:"]),
        component.container(message, [`## Rule ${count + 1}: ${rule[0]}${rule[1] ? `\n${rule[1]}` : ""}`])
      ]
    }, modal.message)
  }
})