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
    components: [component.row(
      component.button({
        id: "prevend",
        emoji: client.emotes.arrowLeftEndWhite,
        disabled: !index
      }),
      component.button({
        id: "prev",
        emoji: client.emotes.arrowLeftWhite,
        disabled: !index
      }),
      component.button({
        id: "modal",
        emoji: client.emotes.textCursorWhite
      }),
      component.button({
        id: "next",
        emoji: client.emotes.arrowRightWhite,
        disabled: index === embeds.length - 1
      }),
      component.button({
        id: "nextend",
        emoji: client.emotes.arrowRightEndWhite,
        disabled: index === embeds.length - 1
      })
    )],
    ephemeral: args?.ephemeral
  })
  await interactionHandler(paginator, async interaction => {
    if (interaction.customId === "modal") {
      return interaction.showModal(component.modal("Select Page", [
        component.textInput({
          id: "page",
          label: `Page Number${args?.selector ? ` or ${args?.selector.name}` : ""}`,
          description: `Select the Page Number${args?.selector ? ` or ${args?.selector.name}` : ""} to go to. There are ${embeds.length.toLocaleString()} pages available`,
          placeholder: `Page Number${args?.selector ? ` / ${args?.selector.name}` : ""}`,
          required: true
        }),
        args?.selector.items ? component.text(`\n\n### ${args?.selector.name}s:\n${quoteList(args?.selector.items)}`) : undefined
      ], "custom"))
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
      interaction.message.components[0].components[0] = disableComponent(interaction.message.components[0].components[0], false)
      interaction.message.components[0].components[1] = disableComponent(interaction.message.components[0].components[1], false)
    } else {
      interaction.message.components[0].components[0] = disableComponent(interaction.message.components[0].components[0])
      interaction.message.components[0].components[1] = disableComponent(interaction.message.components[0].components[1])
    }
    if (index === embeds.length - 1) {
      interaction.message.components[0].components[3] = disableComponent(interaction.message.components[0].components[3])
      interaction.message.components[0].components[4] = disableComponent(interaction.message.components[0].components[4])
    } else {
      interaction.message.components[0].components[3] = disableComponent(interaction.message.components[0].components[3], false)
      interaction.message.components[0].components[4] = disableComponent(interaction.message.components[0].components[4], false)
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