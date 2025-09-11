registerFunction(scriptName, async (message, embeds, args) => {
  embeds = embeds.map((e, i) => {
    if (typeof e === "object") {
      e = structuredClone(e)
      if (!e.footer) {
        e.footer = [`Page ${(i + 1).toLocaleString()} of ${embeds.length.toLocaleString()}`]
      } else {
        e.footer[0] += `Page ${(i + 1).toLocaleString()} of ${embeds.length.toLocaleString()}`
      }
    }
    return e
  })
  async function getEmbed(index) {
    let embed
    if (typeof embeds[index] === "function") {
      embed = structuredClone(await embeds[index]())
      if (!embed.footer) {
        embed.footer = [`Page ${(index + 1).toLocaleString()} of ${embeds.length.toLocaleString()}`]
      } else {
        embed.footer[0] += `Page ${(index + 1).toLocaleString()} of ${embeds.length.toLocaleString()}`
      }
    } else {
      embed = embeds[index]
    }
    return embed
  }
  index = args?.index ?? 0
  const paginator = await sendMessage(message, {
    embeds: [await getEmbed(index)],
    processing: args?.processing,
    components: [makeRow({
      buttons: [
        {
          customId: "prevend",
          emoji: client.emotes.arrowLeftEndWhite,
          disabled: !index
        },
        {
          customId: "prev",
          emoji: client.emotes.arrowLeftWhite,
          disabled: !index
        },
        {
          customId: "modal",
          emoji: client.emotes.textCursorWhite
        },
        {
          customId: "next",
          emoji: client.emotes.arrowRightWhite,
          disabled: index === embeds.length - 1
        },
        {
          customId: "nextend",
          emoji: client.emotes.arrowRightEndWhite,
          disabled: index === embeds.length - 1
        }
      ]
    })],
    ephemeral: args?.ephemeral
  })
  await interactionHandler(paginator, async interaction => {
    if (interaction.customId === "modal") {
      return interaction.showModal(makeModal({
        id: "custom",
        title: "Select Page",
        rows: [{
          text: {
            id: "page",
            label: `Page Number${args?.selector ? ` or ${args?.selector.name}` : ""}`,
            placeholder: `${embeds.length.toLocaleString()} pages available`,
            required: true
          }
        }]
      }))
    }
    if (interaction.customId === "prevend") {
      index = 0
    } else if (interaction.customId === "prev") {
      index--
    } else if (interaction.customId === "next") {
      index++
    } else if (interaction.customId === "nextend") {
      index = embeds.length - 1
    } else if (interaction.customId === "custom") {
      const input = interaction.fields.getTextInputValue("page")
      let passed
      if (input.match(/^[\d,]+$/)) {
        const num = parseInt(input.replaceAll(",", ""))
        if (num > 0 && num <= embeds.length) {
          index = num - 1
          passed = true
        }
      }
      if (!passed && args?.selector) {
        const result = args?.selector.find(input)
        if (defined(result) && result !== -1) {
          index = result
          passed = true
        }
      }
      if (!passed) {
        return sendPrivateError(interaction, {
          title: "Page not found",
          description: `Page ${input.limit().quote()} was not found`
        })
      }
    }
    interaction.deferUpdate()
    if (index) {
      interaction.message.components[0].components[0] = disableButton(interaction.message.components[0].components[0], false)
      interaction.message.components[0].components[1] = disableButton(interaction.message.components[0].components[1], false)
    } else {
      interaction.message.components[0].components[0] = disableButton(interaction.message.components[0].components[0], true)
      interaction.message.components[0].components[1] = disableButton(interaction.message.components[0].components[1], true)
    }
    if (index === embeds.length - 1) {
      interaction.message.components[0].components[3] = disableButton(interaction.message.components[0].components[3], true)
      interaction.message.components[0].components[4] = disableButton(interaction.message.components[0].components[4], true)
    } else {
      interaction.message.components[0].components[3] = disableButton(interaction.message.components[0].components[3], false)
      interaction.message.components[0].components[4] = disableButton(interaction.message.components[0].components[4], false)
    }
    if (args?.ephemeral) {
      editPrivateMessage(paginator, {
        embeds: [await getEmbed(index)],
        components: interaction.message.components
      })
    } else {      
      editMessage(paginator, {
        embeds: [await getEmbed(index)],
        components: interaction.message.components
      })
    }
  }, {
    author: message.author,
    disable: true
  })
})