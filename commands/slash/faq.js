registerSlashCommand(scriptName, slashPath, {
  arguments: [
    {
      name: "category",
      description: "The FAQ category",
      autocomplete: "faqCategories"
    },
    {
      name: "id",
      description: "The FAQ ID",
      autocomplete: "faqIds"
    }
  ],
  execute(interaction, category, id) {
    if ((category && !id) || (!category && id)) return sendError(interaction, { description: "Please provide both a Category and an ID at the same time" })
    if (id === "select-category-first") return sendError(interaction, { description: "Please provide a valid FAQ ID" })
    return interaction.command.prefixCommand.execute(interaction, category && id ? `${category}-${id}` : null)
  }
})
