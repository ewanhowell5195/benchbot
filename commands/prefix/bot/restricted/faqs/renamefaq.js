registerPrefixCommand(scriptName, prefixPath, {
  description: "Rename an FAQ entry.",
  guildOnly: true,
  permissions: ["ManageMessages"],
  aliases: ["faqrename"],
  arguments: [
    {
      name: "oldCategory",
      description: "The old FAQ category",
      maxLength: 32,
      required: true,
      autocomplete: "faqCategories"
    },
    {
      name: "oldId",
      description: "The old FAQ ID",
      maxLength: 32,
      required: true,
      autocomplete: "faqIds:old"
    },
    {
      name: "newCategory",
      description: "The new FAQ category",
      maxLength: 32,
      required: true,
      autocomplete: "faqCategories"
    },
    {
      name: "newId",
      description: "The new FAQ ID",
      maxLength: 32,
      required: true
    }
  ],
  async execute(message, ...args) {
    args = args.slice(0, 4).map(e => e.toLowerCase().trim().replace(/_/g, "-"))
    if (args[0] === args[2] && args[1] === args[3]) {
      return sendError(message, {
        title: "Unable to rename FAQ",
        description: "The old and new names are identical"
      })
    }
    if (args[2].length > 32) {
      return sendError(message, {
        title: "Category too long",
        description: "The maximum category length is `32`"
      })
    }
    if (args[3].length > 32) {
      return sendError(message, {
        title: "ID too long",
        description: "The maximum ID length is `32`"
      })
    }
    const existingOld = db.faq.get(args[0], args[1])
    if (!existingOld) {
      return sendError(message, {
        title: "FAQ not found",
        description: `There was no FAQ found with a category of \`${args[0]}\` and an id of \`${args[1]}\``
      })
    }
    const existingNew = db.faq.get(args[2], args[3])
    if (existingNew) {
      return sendError(message, {
        title: "FAQ already exists",
        description: `There is already an FAQ with a category of \`${args[2]}\` and an id of \`${args[3]}\``
      })
    }
    db.faq.rename(args[2], args[3], args[0], args[1])
    sendMessage(message, {
      title: "FAQ renamed",
      description: `The \`${args[0].toTitleCase(true, true)}: ${args[1].toTitleCase(true, true)}\` FAQ has been renamed to \`${args[2].toTitleCase(true, true)}: ${args[3].toTitleCase(true, true)}\``
    })
  }
})