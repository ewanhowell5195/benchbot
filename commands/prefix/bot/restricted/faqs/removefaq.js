registerPrefixCommand(scriptName, prefixPath, {
  description: "Remove an FAQ entry.",
  guildOnly: true,
  permissions: ["ManageMessages"],
  aliases: ["faqremove", "deletefaq", "faqdelete"],
  arguments: [
    {
      name: "category",
      description: "The FAQ category",
      maxLength: 32,
      required: true,
      autocomplete: "faqCategories"
    },
    {
      name: "id",
      description: "The FAQ ID",
      maxLength: 32,
      required: true,
      autocomplete: "faqIds"
    }
  ],
  async execute(message, category, id) {
    category = category.toLowerCase().trim()
    id = id.toLowerCase().trim()
    let check
    const existing = db.faq.get(category, id)
    if (!existing) return sendError(message, {
      title: "FAQ not found",
      description: `There was no FAQ found with the category \`${category}\` and the id \`${id}\``
    })
    check = await confirm(message, {
      description: `Are you sure you want to remove the FAQ \`${category.toTitleCase(true, true)}: ${id.toTitleCase(true, true)}\`?\n\nThis action cannot be undone`,
      danger: true
    })
    if (!check[0]) return editMessage(check[1], {
      description: "The FAQ removal has been aborted"
    })
    db.faq.remove(category, id)
    editMessage(check[1], {
      title: "FAQ removed",
      description: `The \`${category.toTitleCase(true, true)}: ${id.toTitleCase(true, true)}\` FAQ has been removed`
    })
  }
})