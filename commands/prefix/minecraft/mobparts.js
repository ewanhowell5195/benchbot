function getEntities(cem) {
  const entities = []
  for (const category of cem.categories) {
    if (category.type) continue
    let heading
    for (const entity of category.entities) {
      if (entity.type === "heading") { heading = entity.text; continue }
      entities.push({ ...entity, category: category.name, heading })
      if (entity.variants) {
        for (const variant of entity.variants) {
          variant.model ??= entity.model ?? entity.id
          entities.push({ ...variant, category: category.name, heading })
        }
      }
    }
  }
  return entities
}

function displayName(entity) {
  const name = entity.name ?? (entity.file ?? entity.id).replace(/_/g, " ").toTitleCase()
  return entity.heading ? `${name} [${entity.heading}]` : name
}

registerPrefixCommand(scriptName, prefixPath, {
  description: "Get a list of bone names for each entity supported by OptiFine CEM",
  aliases: ["cemparts", "mob", "cem", "customentitymodel"],
  arguments: [{
    name: "entity",
    description: "The entity",
    async autocomplete(interaction, text) {
      const cem = await cache.cem()
      const entities = getEntities(cem)
      interaction.respond(entities.map(e => ({
        id: e.id,
        displayName: displayName(e)
      })).filter(e => e.id.includes(text) || e.displayName.toLowerCase().includes(text)).sort((a, b) => {
        if (a.displayName.startsWith(text) !== b.displayName.startsWith(text)) {
          return a.displayName.startsWith(text) ? -1 : 1
        }
        return a.displayName.localeCompare(b.displayName)
      }).slice(0, 25).map(e => ({ name: e.displayName, value: e.id })))
    }
  }],
  async execute(message, entity) {
    const cem = await cache.cem()
    const allEntities = getEntities(cem)

    if (!entity) {
      const usage = `Use ${await getCommandName(message, "mobparts", "[entity]")} to view the parts of a specific entity`
      const categories = cem.categories.filter(c => !c.type && c.entities.some(e => !e.type))
      const embeds = categories.flatMap(c => {
        const hasHeadings = c.entities.some(e => e.type === "heading")
        const sections = hasHeadings
          ? c.entities.reduce((s, e) => {
              if (e.type === "heading") s.push([e.text, []])
              else if (!e.type) s[s.length - 1][1].push(e.id)
              return s
            }, [])
          : [[null, c.entities.filter(e => !e.type).map(e => e.id)]]
        const pages = []
        let current = ""
        for (const [heading, ids] of sections) {
          const text = (heading ? `### ${heading}\n` : "") + quoteList(ids) + "\n"
          if (current && current.length + text.length > 4096 - usage.length - 2) {
            pages.push(current.trim())
            current = text
          } else {
            current += text
          }
        }
        if (current.trim()) pages.push(current.trim())
        return pages.map((p, i) => ({
          author: ["OptiFine Custom Entity Models", client.icons.optifine],
          title: `${c.name} Entities${pages.length > 1 ? ` - ${i + 1}/${pages.length}` : ""}`,
          description: `${usage}${p.startsWith("### ") ? "\n" : "\n\n"}${p}`
        }))
      })
      return paginationHandler(message, embeds, {
        selector: {
          name: "Category Name",
          items: categories.map(c => c.name),
          find: str => embeds.findIndex(e => e.title.toLowerCase().split(" - ")[0].includes(str.toLowerCase()))
        }
      })
    }

    entity = entity.toLowerCase().replace(/\s/g, "_")
    let entityData, processing
    while (!entityData) {
      entityData = allEntities.find(e => e.id === entity)
      if (!entityData) {
        const closest = closestMatch(entity, allEntities.map(e => e.id), 0)
        const suggestion = await confirm(message, {
          title: `The entity ${limit(entity).quote()} was not found`,
          description: `Did you mean ${closest.quote()}?`,
          author: ["Error", client.icons.error],
          text: "Yes",
          cancel: "No",
          keep: true
        })
        if (!suggestion[0]) {
          deleteMessage(message)
          return deleteMessage(suggestion[1])
        }
        entity = closest
        processing = suggestion[1]
      }
    }

    const bones = JSON.parse(cem.models[entityData.model ?? entityData.id].model).models.map(e => e.part)
    const fields = []
    if (entityData.variants) {
      fields.push(["Variants", `${quoteList(entityData.variants.map(v => v.id))}\n\nUse ${await getCommandName(message, "mobparts", "[variant]")} to view the parts of a variant`])
    }
    const footer = entityData.category === "Unsupported" ? ["This entity is currently NOT supported by OptiFine"]
      : entityData.category === "Unreleased" ? ["This entity is currently unreleased"]
      : ["You can use the CEM Template Loader plugin to load a working template with the correct part names and pivot points"]
    sendMessage(message, {
      title: displayName(entityData),
      description: quoteList(bones),
      thumbnail: `https://wynem.com/assets/images/minecraft/renders/${entity}.webp`,
      fields: fields.length ? fields : undefined,
      footer,
      components: [component.row(
        component.button({ label: "View online", url: `https://wynem.com/cem/?entity=${entity}` }),
        component.button({ label: "Download template", url: `https://wynem.com/cem/?entity=${entity}&download` }),
        component.button({ label: "Open in Blockbench", url: `https://web.blockbench.net/?plugins=cem_template_loader&model=${entity}&texture` })
      )],
      processing
    })
  }
})
