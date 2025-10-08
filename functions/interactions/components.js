registerFunction(scriptName, {
  component: {
    bitfields: {
      priorityShift: 6,
      priorityMask: 0b11111 << 6,
      getPriority(id) { return (id & this.priorityMask) >>> this.priorityShift }
    },
    container(message, args) {
      const container = new Discord.ContainerBuilder()
      let components = args
      if (Array.isArray(args)) {
        container.setAccentColor(parseInt(client.colours.embed.replace("#", ""), 16))
      } else {
        components = args.components
        if (args.colour !== false && args.colour !== null) {
          container.setAccentColor(args.colour ?? parseInt(client.colours.embed.replace("#", ""), 16))
        }
      }
      for (const item of components) {
        switch (true) {
          case typeof item === "string":
            container.addTextDisplayComponents(component.text(item))
            break
          case item instanceof Discord.ButtonBuilder:
          case item instanceof Discord.StringSelectMenuBuilder:
          case item instanceof Discord.ChannelSelectMenuBuilder:
            container.addActionRowComponents(row => row.addComponents(item))
            break
          case item instanceof Discord.ActionRowBuilder:
            container.addActionRowComponents(item)
            break
          case item instanceof Discord.TextDisplayBuilder:
            container.addTextDisplayComponents(item)
            break
          case item instanceof Discord.SectionBuilder:
            container.addSectionComponents(item)
            break
          case item instanceof Discord.SeparatorBuilder:
            container.addSeparatorComponents(item)
            break
          case item instanceof Discord.FileBuilder:
            container.addFileComponents(item)
            break
          case item instanceof Discord.MediaGalleryBuilder:
            container.addMediaGalleryComponents(item)
            break
          case item instanceof Discord.MediaGalleryItemBuilder:
            container.addMediaGalleryComponents(component.gallery(item))
            break
        }
      }
      return container
    },
    row(...components) {
      return new Discord.ActionRowBuilder().addComponents(components)
    },
    section(components, accessory) {
      const section = new Discord.SectionBuilder()
      if (typeof components === "string") {
        section.addTextDisplayComponents(component.text(components))
      } else if (components.every(e => typeof e === "string")) {
        section.addTextDisplayComponents(component.text(components.join("\n")))
      } else {
        section.addTextDisplayComponents(components.map(e => typeof e === "string" ? component.text(e) : e))
      }
      switch (true) {
        case accessory instanceof Discord.ButtonBuilder:
          section.setButtonAccessory(accessory)
          break
        case accessory instanceof Discord.ThumbnailBuilder:
          section.setThumbnailAccessory(accessory)
          break
      }
      return section
    },
    text(text) {
      return new Discord.TextDisplayBuilder().setContent(text)
    },
    button(args) {
      const button = new Discord.ButtonBuilder()
      if (args.label) button.setLabel(args.label)
      if (args.emoji) button.setEmoji(args.emoji.id ?? args.emoji)
      if (args.disabled) button.setDisabled(true)
      if (args.url) {
        button.setURL(args.url)
        button.setStyle(Discord.ButtonStyle.Link)
      } else {
        button.setCustomId(args.id ?? Math.random().toString())
        if (args.style === "blue") button.setStyle(Discord.ButtonStyle.Primary)
        else if (args.style === "green") button.setStyle(Discord.ButtonStyle.Success)
        else if (args.style === "red") button.setStyle(Discord.ButtonStyle.Danger)
        else button.setStyle(Discord.ButtonStyle.Secondary)
      }
      if (args.right) {
        return component.section("​", button)
      }
      return button
    },
    select(args) {
      let select
      if (args.type === "channel") {
        select = new Discord.ChannelSelectMenuBuilder()
        if (args.types) select.addChannelTypes(...args.types.map(e => getType.channel(e)))
        else select.addChannelTypes(getType.channel("GuildText"))
      } else {
        select = new Discord.StringSelectMenuBuilder()
        const options = []
        for (const [i, o] of args.options.entries()) {
          options.push({
            label: o.label,
            description: o.description,
            emoji: o.emoji?.id ?? o.emoji,
            default: o.default,
            value: o.value ?? i.toString()
          })
        }
        select.setOptions(options)
      }
      select.setCustomId(args.customId ?? Math.random().toString())
      if (args.placeholder) select.setPlaceholder(args.placeholder)
      if (defined(args.minValues)) select.setMinValues(args.minValues)
      if (args.maxValues) select.setMaxValues(args.maxValues)
      return select
    },
    thumbnail(url, args) {
      const thumbnail = new Discord.ThumbnailBuilder().setURL(url.startsWith("http") ? url : `attachment://${url}`)
      if (args?.spoiler) {
        thumbnail.setSpoiler(args.spoiler)
      }
      if (args?.priority) {
        thumbnail.setId(args.priority << component.bitfields.priorityShift)
      }
      return thumbnail
    },
    media(url, args) {
      const media = new Discord.MediaGalleryItemBuilder().setURL(url.startsWith("http") ? url : `attachment://${url}`)
      if (args?.spoiler) {
        media.setSpoiler(args.spoiler)
      }
      return media
    },
    separator(line = true, size = 2) {
      return new Discord.SeparatorBuilder().setDivider(line).setSpacing(size)
    },
    file(name, spoiler = false) {
      return new Discord.FileBuilder().setURL(`attachment://${name}`).setSpoiler(spoiler)
    },
    gallery(...items) {
      const gallery = new Discord.MediaGalleryBuilder()
      if (items[0].items) {
        if (items[0].priority) {
          gallery.setId(items[0].priority << component.bitfields.priorityShift)
        }
        items = items[0].items
      }
      return gallery.addItems(items)
    },
    modal(title, items, id) {
      const modal = new Discord.ModalBuilder({
        title,
        customId: id ?? "modal"
      })
      for (const item of items) {
        switch (true) {
          case item instanceof Discord.TextDisplayBuilder:
            modal.addTextDisplayComponents(item)
            break
          case item instanceof Discord.LabelBuilder:
            modal.addLabelComponents(item)
            break
        }
      }
      return modal
    },
    textInput(args) {
      const label = new Discord.LabelBuilder().setLabel(args.label)
      if (args.description) {
        label.setDescription(args.description)
      }
      const text = new Discord.TextInputBuilder().setCustomId(args.id)
      if (args.value) text.setValue(args.value)
      if (!args.required) text.setRequired(false)
      if (args.placeholder) text.setPlaceholder(args.placeholder)
      if (args.long) text.setStyle(Discord.TextInputStyle.Paragraph)
      else text.setStyle(Discord.TextInputStyle.Short)
      if (args.type === "url") text.setMaxLength(256)
      else if (args.type === "number") text.setMaxLength(8)
      else if (args.type === "colour" || args.type === "emoji") text.setMaxLength(32)
      else if (args.type === "boolean" || args.type === "buttonColour") text.setMaxLength(5)
      else if (args.maxLength || args.length) text.setMaxLength(args.maxLength ?? args.length)
      if (args.minLength || args.length) text.setMinLength(args.minLength ?? args.length)
      return label.setTextInputComponent(text)
    }
  }
})