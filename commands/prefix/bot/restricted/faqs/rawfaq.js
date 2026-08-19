registerPrefixCommand(scriptName, prefixPath, {
  description: [
    "Get the raw text from an FAQ entry.",
    "Run with no arguments to list all FAQs"
  ],
  guildOnly: true,
  permissions: ["ManageMessages"],
  aliases: ["faqraw"],
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
    const faq = db.faq.get(category, id)
    if (!faq) return sendError(message, {
      title: "FAQ not found",
      description: `There was no FAQ found with the category \`${category}\` and the id \`${id}\``
    })
    const files = [await makeFile({
      name: `${category}-${id}.txt`,
      buffer: Buffer.from(faq.text, "utf8")
    })]
    if (Object.keys(faq.data).length) files.push(await makeFile({
      name: `${category}-${id}-data.json`,
      buffer: Buffer.from(JSON.stringify(faq.data, null, 2), "utf8")
    }))
    return sendMessage(message, {
      embedless: true,
      files
    })
  }
})