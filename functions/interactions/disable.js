registerFunction(scriptName, {
  disableComponent(component, disable = true) {
    switch (true) {
      case component instanceof Discord.ButtonComponent:
      case component instanceof Discord.ButtonBuilder:
        return Discord.ButtonBuilder.from(component).setDisabled(disable)
      case component instanceof Discord.StringSelectMenuComponent:
      case component instanceof Discord.StringSelectMenuBuilder:
        return Discord.StringSelectMenuBuilder.from(component).setDisabled(disable)
      case component instanceof Discord.ChannelSelectMenuComponent:
      case component instanceof Discord.ChannelSelectMenuBuilder:
        return Discord.ChannelSelectMenuBuilder.from(component).setDisabled(disable)
    }
  },
  disableComponents(components) {
    let modified = false
    for (const [i, component] of components.entries()) {
      if (
        component instanceof Discord.ContainerComponent ||
        component instanceof Discord.ContainerBuilder ||
        component instanceof Discord.ActionRow ||
        component instanceof Discord.ActionRowBuilder
      ) {
        if (this.disableComponents(component.components)) {
          modified = true
        }
      } else if (
        component instanceof Discord.SectionComponent &&
        (component.accessory instanceof Discord.ButtonComponent ||
         component.accessory instanceof Discord.ButtonBuilder)
      ) {
        if (!component.accessory.data?.url) {
          component.accessory = this.disableComponent(component.accessory)
          modified = true
        }
      } else if (
        component instanceof Discord.ButtonComponent ||
        component instanceof Discord.ButtonBuilder ||
        component instanceof Discord.StringSelectMenuComponent ||
        component instanceof Discord.StringSelectMenuBuilder ||
        component instanceof Discord.ChannelSelectMenuComponent ||
        component instanceof Discord.ChannelSelectMenuBuilder
      ) {
        if (!component.data.url) {
          components[i] = this.disableComponent(component)
          modified = true
        }
      }
    }
    return modified
  }
})