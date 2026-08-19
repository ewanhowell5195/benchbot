registerFunction(scriptName, async (message, args) => {
  if (args.embeds) {
    for (let i = 0; i < args.embeds.length; i++) {
      if (!(args.embeds[i] instanceof Discord.EmbedBuilder || args.embeds[i] instanceof Discord.Embed)) {
        args.embeds[i] = makeEmbed(message, args.embeds[i])
      }
    }
  }
  if (args.components) {
    if (!Array.isArray(args.components)) {
      args.components = [args.components]
    }
    args.components = args.components.map(item => {
      if (typeof item === "string") {
        return component.text(item)
      } else if (item instanceof Discord.ButtonBuilder || item instanceof Discord.StringSelectMenuBuilder || item instanceof Discord.ChannelSelectMenuBuilder) {
        return component.row(item)
      } else if (item instanceof Discord.MediaGalleryItemBuilder) {
        return component.gallery(item)
      }
      return item
    })
  }
  if (args.files) {
    await Promise.all(args.files.map(async (file, i) => {
      if (!(file instanceof Discord.AttachmentBuilder)) {
        args.files[i] = await makeFile(file)
      }
    }))
  }
})