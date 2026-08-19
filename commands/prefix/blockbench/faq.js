registerPrefixCommand(scriptName, prefixPath, {
  description: [
    "View an FAQ entry.",
    "Run with no arguments to list all FAQs."
  ],
  aliases: ["faqs"],
  arguments: [{
    name: "id",
    description: "The FAQ ID"
  }],
  async execute(message, id) {
    const faqList = db.faq.all()
    if (!id) {
      const categories = {}
      for (const entry of faqList) {
        categories[entry.category] ??= []
        categories[entry.category].push(entry.id)
      }
      return sendMessage(message, {
        author: ["FAQ", client.icons.faq],
        description: `Use the command \`${getCommandName(message)} [category] [id]\` to view a specific FAQ entry`,
        fields: Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0])).map(e => [e[0].toTitleCase(true, true), quoteList(e[1].sort())]),
        deletable: true
      })
    }
    const faqIds = []
    const faqs = faqList.map(e => {
      const id = `${e.category}-${e.id}`
      faqIds.push(e.id)
      faqIds.push(id)
      e.data.aliases?.forEach(a => faqIds.push(a, `${e.category}-${a}`))
      return [id, e]
    })
    const match = closestMatch(id, faqIds)
    if (!match) return sendError(message, {
      title: "Unknown FAQ",
      description: `The FAQ \`${limit(id)}\` was not found\n\nUse the command \`${getCommandName(message)}\` to view a list of all FAQs`
    })
    const faq = faqs.find(e => e[0] === match || e[1].id === match || e[1].data.aliases?.some(a => a === match || `${e[1].category}-${a}` === match))
    sendMessage(message, makeFAQ(faq[1]))
  }
})