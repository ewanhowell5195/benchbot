registerContextCommand(scriptName, {
  name: "Relocate Message",
  guildOnly: true,
  execute: interaction => interaction.command.prefixCommand.execute(interaction)
})