registerFunction(scriptName, {
  makeRow(args) {
    const row = new Discord.ActionRowBuilder()
    if (args.buttons) {
      const buttons = []
      for (const b of args.buttons) {
        const button = new Discord.ButtonBuilder()
        if (b.label) button.setLabel(b.label)
        if (b.emoji) button.setEmoji(b.emoji)
        if (b.disabled) button.setDisabled(true)
        if (b.url) {
          button.setURL(b.url)
          button.setStyle(Discord.ButtonStyle.Link)
        } else {
          if (b.customId) button.setCustomId(b.customId)
          else button.setCustomId(Math.random().toString())
          if (b.style) {
            if (b.style === "blue") button.setStyle(Discord.ButtonStyle.Primary)
            else if (b.style === "green") button.setStyle(Discord.ButtonStyle.Success)
            else if (b.style === "red") button.setStyle(Discord.ButtonStyle.Danger)
            else button.setStyle(Discord.ButtonStyle.Secondary)
          } else button.setStyle(Discord.ButtonStyle.Secondary)
        }
        buttons.push(button)
      }
      row.addComponents(buttons)
    } else if (args.select) {
      let select
      if (args.select.type === "channel") {
        select = new Discord.ChannelSelectMenuBuilder()
        if (args.select.types) select.addChannelTypes(...args.select.types.map(e => getType.channel(e)))
        else select.addChannelTypes(getType.channel("GuildText"))
      } else {
        select = new Discord.StringSelectMenuBuilder()
        const options = []
        for (const [i, o] of args.select.options.entries()) options.push({
          label: o.label,
          description: o.description,
          emoji: o.emoji,
          default: o.default,
          value: o.value ?? i.toString()
        })
        select.setOptions(options)
      }
      if (args.select.customId) select.setCustomId(args.select.customId)
      else select.setCustomId(Math.random().toString())
      if (args.select.placeholder) select.setPlaceholder(args.select.placeholder)
      if (defined(args.select.minValues)) select.setMinValues(args.select.minValues)
      if (args.select.maxValues) select.setMaxValues(args.select.maxValues)
      row.addComponents([select])
    } else if (args.text) {
      const text = new Discord.TextInputBuilder()
      text.setCustomId(args.text.id)
      text.setLabel(args.text.label)
      if (!args.text.required) text.setRequired(false)
      if (args.text.placeholder) text.setPlaceholder(args.text.placeholder)
      if (args.text.long) text.setStyle(Discord.TextInputStyle.Paragraph)
      else text.setStyle(Discord.TextInputStyle.Short)
      if (args.text.type === "url") text.setMaxLength(256)
      else if (args.text.type === "number") text.setMaxLength(8)
      else if (args.text.type === "duration") text.setMaxLength(8)
      else if (args.text.type === "colour" || args.text.type === "emoji") text.setMaxLength(32)
      else if (args.text.type === "boolean" || args.text.type === "buttonColour") text.setMaxLength(5)
      else if (args.text.type === "role") text.setMaxLength(100)
      else if (args.text.maxLength) text.setMaxLength(args.text.maxLength)
      if (args.text.minLength) text.setMinLength(args.text.minLength)
      row.addComponents(text)
    }
    return row
  },
  makeModal(args) {
    const modal = new Discord.ModalBuilder({
      customId: args.id || Math.random().toString(),
      title: args.title
    })
    for (const row of args.rows) {
      if (typeof row === "string") {
        modal.addTextDisplayComponents(component.text(row))
      } else {
        modal.addComponents(component.label({
          label: row.label,
          description: row.description,
          component: row.component
        }))
      }
    }
    return modal
  }
})