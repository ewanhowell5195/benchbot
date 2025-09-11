registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: [
      "Get a list of the bot's commands and information about each one.",
      "Argument types:\n\n[arg] - A text argument\n<arg> - A discord feature (mentions, emojis, etc...)\n{arg} - A file argument"
    ],
    arguments: "[category/command]"
  },
  aliases: ["h", "hlp", "commands", "commandslist", "commandlist"],
  async execute(message, args, interaction) {
    if (!args[0]) return sendMessage(message, {
      author: [client.user.displayName, client.icons.help],
      thumbnail: avatar(client.user),
      description: `Use \`${getCommandName(message)} [category]\` to view the commands in a category\n\n\`${Object.keys(client.commandTree).join("`\n`").toTitleCase()}\``
    })
    let input
    if (args[0].name) input = args[0].name
    else input = args[0].toLowerCase()
    if (client.categories[input]) {
      if ((input === "restricted" || client.categories[input].parents.includes("restricted")) && !(config.owners.includes(message.author.id) || isMod(message.member))) return sendError(message, {
        author: ["Category restricted", client.icons.help],
        description: "Only moderators can see that category"
      })
      const category = client.categories[input]
      const maxLength = category.commands.reduce((a, e) => Math.max(a, e.name.length + 2), 10)
      const tree = category.parents.concat([input])
      const subcategories = Object.keys(category.categories).filter(e => e !== "restricted")
      return sendMessage(message, {
        author: [tree.join(" > "), client.icons.help],
        description: `Use \`${getCommandName(message)} [command]\` to view more information about a command\n\n` +
                     (category.description ? `**Description**\`\`\`\n${Array.isArray(category.description) ? category.description.join("``````") : category.description}\`\`\`\n` : "") +
                     (subcategories.length > 0 ? `**Subcategories**\n\`${subcategories.join("`\n`").toTitleCase()}\`\n\n` : "") +
                     (category.commands.length > 0 ? `**Commands**\`\`\`\n${category.commands.map(e => `${e.name.padEnd(maxLength)}${e.help?.arguments ? e.help.arguments.replace(/ /g, "") : ""}`).join("\n")}\`\`\`\n` : "")
      })
    }
    const command = await argTypes.command(input, {
      custom: true,
      message
    })
    if (!command) return
    if (command.parents.includes("restricted") && !(config.owners.includes(message.author.id) || isMod(message.member))) return sendError(message, {
      author: ["Command restricted", client.icons.help],
      description: "Only the moderators can see that command"
    })
    let slash
    if (command.slashCommand) {
      const id = await getCommand(command.slashCommand, { guild: testMode ? message.guild : undefined, id: true })
      if (id) slash = `</${command.slashCommand.tree.join(" ")}:${id}>`
    }
    const fields = [
      ["Description", `\`\`\`\n${Array.isArray(command.help.description) ? command.help.description.join("``````") : command.help.description}\`\`\``],
      ["Formatting", `\`${config.prefix}${command.name}${command.help?.arguments ? ` ${command.help.sheetArguments ?? command.help.arguments}` : ""}\``]
    ]
    const permissions = [...command.permissions]
    if (command.guildOnly) permissions.unshift("GuildOnly")
    if (command.dmOnly) permissions.unshift("DirectMessagesOnly")
    if (permissions.length > 0) fields.push(["Restricted to", quoteList(permissions.map(e => e.toTitleCase(true)))])
    if (command.aliases) fields.push(["Aliases", quoteList(command.aliases)])
    if (slash) fields.push(["Slash command", slash])
    const embed = {
      author: [command.name, client.icons.help],
      footer: [`Category: ${command.parents.join(" > ").toTitleCase()}`],
      fields
    }
    const buttons = []
    if (command.help?.links) {
      for (const link of command.help.links) buttons.push({
        label: link[0],
        url: link[1]
      })
    }
    if (buttons.length) embed.components = [makeRow({buttons})]
    if (interaction) return sendPrivateMessage(interaction, embed)
    sendMessage(message, embed)
  }
})