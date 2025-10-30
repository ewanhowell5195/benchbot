registerSlashCommand(scriptName, slashPath, {
  description: "Get a list of the bots commands and information about each one.",
  options: [{
    name: "category-command",
    description: "The category or command",
    autocomplete: (interaction, text) => {
      const commands = Array.from(client.prefixCommands).filter(e => e[0] === e[1].name && !e[1].parents.includes("restricted"))
      if (text) return interaction.respond(filteredSort(commands.map(e => [e[0], e[1].aliases]).flat().flat().filter(Boolean), text, 25).map(e => ({ name: e, value: e })))
      interaction.respond(commands.map(e => e[0]).sort().slice(0, 25).map(e => ({ name: e, value: e })))
    }
  }]
})