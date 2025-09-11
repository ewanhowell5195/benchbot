const types = ["png", "jpeg", "gif", "webp"]

registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: [
      "Submit a model to the archive!",
      'Messages in #model-showcase can be prefixed with "[P]" instead of running this command.',
      "This command requires a message attachment image.",
      "To add a description in a prefix command, use a new line after the title."
    ],
    arguments: "[title]"
  },
  typingless: true,
  aliases: ["submit", "artchive", "pinmodel", "[p]"],
  arguments: ["*title"],
  async execute(message, args) {
    args[0] = args[0].replace(/^\[p\]\s?/i, "")
    if (!args[1]) {
      [args[0], args[1]] = args[0].split(/(?<=^[^\n]*)\n/)
    }
    const images = Array.from(message.attachments.filter(e => e.contentType?.startsWith("image/"))).slice(0, 4)
    if (!images.length) {
      if (message.attachments.size) return sendError(message, {
        title: "Missing images",
        description: "The provided files were not images"
      })
      if (!images.length) return sendError(message, {
        title: "Missing images",
        description: "Please provide at least one image"
      })
    }
    if (args[0].length < 3) return sendError(message, {
      title: "Model title too short",
      description: "The mimimum title length is `3` characters. Please provide a longer title"
    })
    if (args[0].length > 50) return sendError(message, {
      title: "Model title too long",
      description: "The maximum title length is `50` characters. Please provide a shorter title.\nThe first line of your post gets used as the title. You can add additional lines to write a description."
    })
    let processing
    const files = []
    if (message.command.slash) {
      processing = await sendProcessing(message, null, { ephemeral: true })
      for (const [i, image] of images.entries()) {
        const r = await fetch(image[1].url, { method: "HEAD" })
        if (r.headers.get("content-length") > fileSizeLimit) {
          return sendError(message, {
            title: "File too large",
            description: `The maximum file size is \`8 MB\`.\n\nTo use larger files, use the prefix command \`${config.prefix}${message.command.prefixCommand.name}\``,
            processing
          })
        }
        const type = r.headers.get("content-type").split("/")
        if (type[0] !== "image" || !types.includes(type[1])) {
          return sendError(message, {
            title: "Not a valid image",
            description: `The provided [file](${image[1].url}) was not an valid image. The supported image types are: ${quoteList(types)}`,
            processing
          })
        }
        files.push(await makeFile({
          name: `image${i}.${type[1]}`,
          buffer: Buffer.from(await fetch(image[1].url).then(e => e.arrayBuffer()))
        }))
        image[1].url = `attachment://image${i}.${type[1]}`
      }
    }
    const url = !message.command.slash && message.guild ? `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}` : message.command.slash ? "https://web.blockbench.net/" : images[0][1].url
    const embeds = [{
      title: args[0],
      url,
      description: `${args[1] ? `${args[1]}\n\n` : ""}**By ${message.author}**`,
      image: images.shift()[1].url,
      thumbnail: avatar(message.member, 48)
    }]
    for (const image of images) embeds.push({
      url,
      image: image[1].url
    })
    const channel = await getChannel(config.channels.archive)
    const archive = await sendMessage(channel, {
      embeds,
      files
    })
    if (message.command.slash) sendMessage(message, {
      description: "The model was added to the archive!",
      ephemeral: true,
      components: [makeRow({
        buttons: [{
          label: "Jump to archive...",
          url: `https://discord.com/channels/${archive.guildId}/${archive.channelId}/${archive.messageId}`
        }]
      })]
    })
    else timedReact(message, client.emotes.success)
    react(archive, config.emotes.like)
    if (isType.channel(channel, "GuildNews")) {
      archive.crosspost()
    }
  }
})