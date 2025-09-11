registerSlashCommand(scriptName, slashPath, {
  options: [{
    type: "string",
    name: "entity",
    description: "The entity",
    async autocomplete(interaction, text) {
      const cem = await cache.cem()
      interaction.respond([
        cem.categories.find(e => e.name === "Supported").entities,
        cem.categories.find(e => e.name === "Legacy").entities,
        cem.categories.find(e => e.name === "Unsupported")?.entities ?? [],
        cem.categories.find(e => e.name === "Unreleased")?.entities ?? []
      ].flat().flatMap(e => {
        if (e.type) return
        if (typeof e === "string") {
          return {
            name: e,
            display_name: e.toTitleCase(true)
          }
        }
        if (!e.display_name) {
          e.display_name = e.name.toTitleCase(true)
        }
        const entities = [e]
        if (e.variants) {
          for (let variant of e.variants) {
            if (typeof variant === "string") {
              variant = {
                name: variant,
                display_name: variant.toTitleCase(true)
              }
            } else if (!variant.display_name) {
              variant.display_name = variant.name.toTitleCase(true)
            }
            entities.push(variant)
          }
        }
        return entities
      }).filter(e => e?.name.includes(text) || e?.display_name.toLowerCase().includes(text)).sort((a, b) => {
        a = a.display_name
        b = b.display_name
        if (a.startsWith(text)) {
          if (b.startsWith(text)) return a.localeCompare(b)
          return -1
        }
        if (b.startsWith(text)) return 1
        return a.localeCompare(b)
      }).slice(0, 25).map(e => ({ name: e.display_name, value: e.name })))
    }
  }]
})