async function tryFile(args) {
  try {
    return await makeFile(args)
  } catch (err) {
    console.error(err)
  }
}

registerFunction(scriptName, async (message, data) => {
  const channel = message.channel ?? message
  const files = [await tryFile(data)]
  if (!files[0]) return sendError(message, {
    title: "Unable to save image",
    description: "An error occured while trying to save that image",
    processing: data.processing
  })
  if (files[0].attachment.length > 26214400) return sendError(message, {
    title: "Unable to upload file",
    description: `The command completed sucessfully, but the resulting file was over the \`25 MB\` upload limit\n\nThe file was \`${formatBytes(files[0].attachment.length)}\``,
    processing: data.processing
  })
  let width, height, embed
  if (files[0].width) {
    width = files[0].width
    height = files[0].height
  } else {
    try {
      const img = await loadImage(files[0].attachment)
      width = img.width
      height = img.height
    } catch {
      embed = false
    }
  }
  if (embed === false || data.embedless) {
    if (data.processing) try {
      return await (message.command.application ? message.editReply.bind(message) : data.processing.edit.bind(data.processing))({
        allowedMentions: { repliedUser: false },
        files,
        embeds: []
      })
    } catch {}
    try {
      return await (message.deferred ? message.editReply.bind(message) : message.reply.bind(message))({
        allowedMentions: { repliedUser: false },
        files,
        embeds: []
      })
    } catch {
      try {
        return await channel.send({
          files,
        embeds: []
        })
      } catch {
        return sendError(message, {
          title: "Failed to upload file",
          description: "The file failed to upload to Discord.",
          processing: data.processing
        })
      }
    }
  }
  const embeds = [makeEmbed(message, {
    url: data.combine ? "https://wynem.com/" : undefined,
    colour: client.colours.discordembeddark,
    image: `attachment://${data.name}`
  })]
  let footerText = `${data.name} - ${width}x${height} - ${formatBytes(files[0].attachment instanceof Buffer ? Buffer.byteLength(files[0].attachment) : fs.statSync(files[0].attachment).size)}`
  if (data.extras) {
    for (const extra of data.extras) {
      const file = await tryFile(extra)
      if (!file) return sendError(message, {
        title: "Unable to save image",
        description: "An error occured while trying to save that image",
        processing: data.processing
      })
      files.push(file)
      if (files[0].width) {
        width = file.width
        height = file.height
      } else {
        try {
          const img = await loadImage(file.attachment)
          width = img.width
          height = img.height
        } catch {
          continue
        }
      }
      const footer = `${extra.name} - ${width}x${height} - ${formatBytes(file.attachment instanceof Buffer ? Buffer.byteLength(file.attachment) : fs.statSync(file.attachment).size)}`
      embeds.push(makeEmbed(message, {
        url: data.combine ? "https://wynem.com/" : undefined,
        colour: client.colours.discordembeddark,
        image: `attachment://${extra.name}`,
        footer: data.combine ? undefined : [footer]
      }))
      if (data.combine) footerText += `\n${footer}`
    }
  }
  embeds[0].setFooter({text: footerText})
  if (data.thumbnail) {
    embeds[0].setThumbnail(`attachment://${data.thumbnail.name}`)
    files.push(await tryFile(data.thumbnail))
  }
  if (data.processing) try {
    return await (message.command.application ? message.editReply.bind(message) : data.processing.edit.bind(data.processing))({
      allowedMentions: { repliedUser: false },
      files,
      embeds
    })
  } catch {}
  try {
    return await (message.deferred ? message.editReply.bind(message) : message.reply.bind(message))({
      allowedMentions: { repliedUser: false },
      files,
      embeds
    })
  } catch {
    try {
      return await channel.send({
        files,
        embeds
      })
    } catch {
      return sendError(message, {
        title: "Failed to upload image",
        description: "The image failed to upload to Discord.",
        processing: data.processing
      })
    }
  }
})