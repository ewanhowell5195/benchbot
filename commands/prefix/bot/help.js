function formatArguments(command) {
  if (!command.arguments) return ""
  return ` ${command.arguments.map(e => e.required ? `<${e.id}>` : `[${e.id}]`).join(" ")}`
}

registerPrefixCommand(scriptName, prefixPath, {
  description: [
    "Get a list of the bot's commands and information about each one.",
    "Arguments marked with `<>` are required, and arguments marked with `[]` are optional"
  ],
  aliases: ["h", "hlp", "commands", "commandslist", "commandlist"],
  arguments: [{
    type: "command",
    name: "categoryOrCommand",
    description: "The category or command",
    categories: true,
    autocomplete: (interaction, text) => {
      const commands = Array.from(client.prefixCommands).filter(e => e[0] === e[1].name && !e[1].parents.includes("restricted"))
      if (text) return interaction.respond(filteredSort(commands.map(e => [e[0], e[1].aliases]).flat().flat().filter(Boolean), text, 25).map(e => ({ name: e, value: e })))
      interaction.respond(commands.map(e => e[0]).sort().slice(0, 25).map(e => ({ name: e, value: e })))
    }
  }],
  async execute(message, command, interaction) {
    if (!command) return sendMessage(message, {
      author: [client.user.displayName, client.icons.help],
      thumbnail: avatar(client.user),
      description: `Use \`${await getCommandName(message)} [category]\` to view the commands in a category\n\n\`${Object.keys(client.commandTree).join("`\n`").toTitleCase()}\``
    })
    if (command.categories) {
      if ((command.name === "restricted" || command.parents.includes("restricted")) && !(config.owners.includes(message.author.id) || isMod(message.member))) return sendError(message, {
        author: ["Category restricted", client.icons.help],
        description: "Only moderators can see that category"
      })
      const maxLength = command.commands.reduce((a, e) => Math.max(a, e.name.length + 2), 10)
      const tree = command.parents.concat([command.name])
      const subcategories = Object.keys(command.categories).filter(e => e !== "restricted")
      return sendMessage(message, {
        author: [tree.join(" > "), client.icons.help],
        description: `Use \`${await getCommandName(message)} [command]\` to view more information about a command\n\n` +
                     (command.description ? `**Description**\`\`\`\n${Array.isArray(command.description) ? command.description.join("``````") : command.description}\`\`\`\n` : "") +
                     (subcategories.length > 0 ? `**Subcategories**\n\`${subcategories.join("`\n`").toTitleCase()}\`\n\n` : "") +
                     (command.commands.length > 0 ? `**Commands**\`\`\`\n${command.commands.map(e => `${e.name.padEnd(maxLength)}${formatArguments(e).replace(/ /g, "")}`).join("\n")}\`\`\`\n` : "")
      })
    }
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
      ["Description", `\`\`\`\n${Array.isArray(command.description) ? command.description.join("``````") : command.description}\`\`\``],
      ["Formatting", `\`${config.prefix}${command.name}${formatArguments(command)}\``]
    ]
    if (command.arguments) {
      fields.push(["Arguments", command.arguments.map(e => argTypes[e.type].render(e)).join("\n")])
    }
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
    if (command.links) {
      for (const link of command.links) buttons.push({
        label: link[0],
        url: link[1]
      })
    }
    if (buttons.length) embed.components = [component.row(...buttons.map(e => component.button(e)))]
    if (interaction instanceof Discord.BaseInteraction && interaction.isButton?.()) return sendPrivateMessage(interaction, embed)
    sendMessage(message, embed)
  }
})