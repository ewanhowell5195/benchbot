function flatten(entity) {
  if (typeof entity === "string") {
    return entity
  }
  const entities = [entity]
  if (entity.variants) {
    for (let variant of entity.variants) {
      if (typeof variant === "string") {
        variant = {
          name: variant
        }
      }
      variant.model ??= entity.model ?? entity.name
      entities.push(variant)
    }
  }
  return entities
}

registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Get a list of bone names for each entity supported by OptiFine CEM",
    arguments: "[entity]"
  },
  aliases: ["cemparts", "mob", "cem", "customentitymodel"],
  arguments: ["?*entity"],
  async execute(message, args) {
    let entity = args[0]
    const cem = await cache.cem()
    const supported = cem.categories.find(e => e.name === "Supported").entities.flatMap(flatten)
    const legacy = cem.categories.find(e => e.name === "Legacy").entities.flatMap(flatten)
    const unsupported = cem.categories.find(e => e.name === "Unsupported")?.entities.flatMap(flatten) ?? []
    const unreleased = cem.categories.find(e => e.name === "Unreleased")?.entities.flatMap(flatten) ?? []
    let supportedEntities = supported.map(e => e.name ?? e)
    let legacyEntities = legacy.map(e => e.name ?? e)
    let unsupportedEntities = unsupported.map(e => e.name ?? e)
    let unreleasedEntities = unreleased.map(e => e.name ?? e)
    if (!entity) {
      const types = [
        ["Supported", supportedEntities],
        ["Legacy", legacyEntities],
        ["Unsupported", unsupportedEntities],
        ["Unreleased", unreleasedEntities]
      ].filter(e => e[1].length)
      const embeds = types.flatMap(e => {
        if (e[0] === "Legacy") {
          const fields = []
          for (const entity of e[1]) {
            if (entity.type === "heading") {
              fields.push([entity.text, []])
            } else if (!entity.type) {
              fields[fields.length - 1][1].push(entity)
            }
          }
          return {
            author: ["OptiFine Custom Entity Models", client.icons.optifine],
            title: "Legacy Entities",
            fields: fields.map(e => [e[0], quoteList(e[1])])
          }
        }
        const parts = []
        const entities = e[1].filter(e => !e.type)
        for (let i = 0; i < entities.length; i += 128) {
          parts.push(entities.slice(i, i + 128))
        }
        return parts.map((p, i) => ({
          author: ["OptiFine Custom Entity Models", client.icons.optifine],
          title: `${e[0]} Entities${parts.length > 1 ? ` - ${i + 1}/${parts.length}` : ""}`,
          description: i + 1 < parts.length ? quoteList(p) + "…" : quoteList(p)
        }))
      })
      return paginationHandler(message, embeds, {
        selector: {
          name: "Category Name",
          find: str => embeds.findIndex(e => e.title.toLowerCase().split(" - ")[0].includes(str.toLowerCase()))
        }
      })
    }
    entity = entity.toLowerCase().replace(/\s/g, "_")
    let entityData, processing
    supportedEntities = supportedEntities.filter(e => !e.type)
    legacyEntities = legacyEntities.filter(e => !e.type)
    unsupportedEntities = unsupportedEntities.filter(e => !e.type)
    unreleasedEntities = unreleasedEntities.filter(e => !e.type)
    let footer = ["You can use the CEM Template Loader plugin to load a working template with the correct part names and pivot points"]
    while (!entityData) {
      if (supportedEntities.includes(entity)) {
        entityData = supported.find(e => (e.name ?? e) === entity)
      } else if (legacyEntities.includes(entity)) {
        entityData = legacy.find(e => (e.name ?? e) === entity)
      } else if (unsupportedEntities.includes(entity)) {
        entityData = unsupported.find(e => (e.name ?? e) === entity)
        footer = ["This entity is currently NOT supported by OptiFine"]
      } else if (unreleasedEntities.includes(entity)) {
        entityData = unreleased.find(e => (e.name ?? e) === entity)
        footer = ["This entity is currently unreleased"]
      } else {
        const closest = closestMatch(entity, supportedEntities.concat(legacyEntities, unsupportedEntities, unreleasedEntities), 0)
        const suggestion = await confirm(message, {
          title: `The entity ${entity.limit().quote()} was not found`,
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
    const bones = JSON.parse(cem.models[entityData.model ?? entityData.name ?? entityData].model).models.map(e => e.part)
    const entityName = entityData.display_name ?? (entityData.name ?? entityData).replace(/_/g, " ").toTitleCase()
    sendMessage(message, {
      title: entityName,
      description: quoteList(bones),
      thumbnail: `https://wynem.com/assets/images/minecraft/renders/${entity}.webp`,
      footer,
      components: [makeRow({
        buttons: [
          {
            label: "View online",
            url: `https://wynem.com/cem/?entity=${entity}`
          },
          {
            label: "Download template",
            url: `https://wynem.com/cem/?entity=${entity}&download`
          },
          {
            label: "Open in Blockbench",
            url: `https://web.blockbench.net/?plugins=cem_template_loader&model=${entity}&texture`
          }
        ]
      })],
      processing
    })
  }
})