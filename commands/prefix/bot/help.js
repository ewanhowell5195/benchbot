registerPrefixCommand(scriptName, prefixPath, {
  description: "Get a list of the bot's commands and information about each one.",
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
    if (!command) {
      return sendComponents(message, {
        title: client.user.displayName,
        description: `Use ${await getCommandName(message, "help", "[category]")} to view the commands in a category\n\n- ${Object.keys(client.commandTree).sort().map(e => e.toTitleCase()).join("\n- ")}`,
        thumbnail: await avatar(client.user)
      })
    }
    if (command.categories) {
      if ((command.name === "restricted" || command.parents.includes("restricted")) && !(config.owners.includes(message.author.id) || isMod(message.member))) {
        return sendError(message, {
          author: ["Category restricted", client.icons.help],
          description: "Only moderators can see that category"
        })
      }
      const tree = command.parents.concat([command.name])
      const subcategories = Object.keys(command.categories).filter(e => e !== "restricted")
      return sendComponents(interaction ?? message, {
        components: component.container(message, [
          `## ${tree.join(" > ").toTitleCase()}`,
          `Use ${await getCommandName(message, "help", "[command]")} to view more information about a command`,
          command.description ? `### Description\n>>> ${Array.isArray(command.description) ? command.description.map(e => e.replaceAll("\n- ", "\n  - ")).join("\n- ") : command.description}` : undefined,
          subcategories.length ? `### Subcategories\n- ${subcategories.map(e => e.toTitleCase()).join("\n- ")}` : undefined,
          command.commands.length ? `### Commands\n- ${command.commands.map(e => e.name).join("\n- ")}` : undefined
        ].filter(Boolean)),
        ephemeral: interaction
      })
    }
    if (command.parents.includes("restricted") && !(config.owners.includes(message.author.id) || isMod(message.member))) {
      return sendError(message, {
        author: ["Command restricted", client.icons.help],
        description: "Only moderators can see that command"
      })
    }
    const permissions = command.permissions.slice()
    if (command.guildOnly) permissions.unshift("ServerOnly")
    if (command.dmOnly) permissions.unshift("DirectMessagesOnly")
    async function buildComponents(mode) {
      const components = [`## ${command.name}`]
      components.push(`### Description\n>>> ${Array.isArray(command.description) ? command.description.map(e => e.replaceAll("\n- ", "\n  - ")).join("\n- ") : command.description}`)
      if (command.links) {
        components.push(component.row(...command.links.map(e => component.button({ label: e[0], url: e[1] }))))
      }
      const args = mode === "slash" ? command.slashCommand.arguments : command.arguments
      components.push(`### Formatting\n${await getCommandName(message, command.name, args?.map(e => e.required ? `<${e.id}>` : `[${e.id}]`).join(" "), mode)}`)
      if (args) {
        components.push(`### Arguments\n${args.map(e => argTypes[e.type].render(e)).join("\n")}`)
      }
      if (args?.some(e => e.required)) {
        components.push(`-# (*) Required`)
      }
      if (permissions.length) {
        components.push(`### Restricted to\n${quoteList(permissions.map(e => e.toTitleCase(true)))}`)
      }
      if (mode === "prefix" && command.aliases) {
        components.push(`### Aliases\n${quoteList(command.aliases)}`)
      }
      components.push(component.section(`-# Category: ${command.parents.join(" > ").toTitleCase()}`, component.button(mode === "slash" ? {
        id: "prefix",
        label: "Show Prefix",
        emoji: client.emotes.prefixWhite
      } : {
        id: "slash",
        label: "Show Slash",
        emoji: client.emotes.slashWhite,
        disabled: !command.slashCommand
      })))
      return component.container(message, components)
    }
    const help = await sendComponents(interaction ?? message, {
      components: await buildComponents(message.command?.slash && command.slashCommand ? "slash" : "prefix"),
      ephemeral: interaction
    })
    interactionHandler(help, async (interaction, collector, state) => {
      if (interaction.customId === "slash" || interaction.customId === "prefix") {
        if (hasFlag.message(interaction.message, "Ephemeral")) {
          await interaction.deferUpdate()
          return editPrivateComponents(interaction, await buildComponents(interaction.customId))
        }
        if (interaction.user.id !== message.author.id) {
          state.messages.push(await sendPrivateComponents(interaction, await buildComponents(interaction.customId)))
          return
        }
        await editComponents(help, {
          components: await buildComponents(interaction.customId)
        })
        interaction.deferUpdate()
      }
    })
  }
})