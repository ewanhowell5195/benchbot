async function setup(message, args) {
  if (Array.isArray(args)) {
    args = { components: [component.container(message, args)] }
  } else if (Object.getPrototypeOf(args) !== Object.prototype) {
    if (args instanceof Discord.ContainerBuilder) {
      args = { components: [args] }
    } else {
      args = { components: [component.container(message, [args])] }
    }
  }
  args.embedless = true
  args.flags = getFlag.message("IsComponentsV2")
  args.allowedMentions = {}
  if (!args.components) {
    const components = []
    const parts = []
    if (args.title) {
      if (args.url) {
        parts.push(`## [${args.title}](${args.url})`)
      } else {
        parts.push(`## ${args.title}`)
      }
    }
    if (args.description) {
      parts.push(args.description)
    }
    if (args.thumbnail) {
      components.push(component.section(parts, component.thumbnail(args.thumbnail)))
    } else {
      components.push(parts.join("\n"))
    }
    if (args.fields) {
      for (const field of args.fields) {
        components.push(`### ${field[0]}\n${field[1]}`)
      }
    }
    if (args.image) {
      components.push(component.media(args.image))
    }
    if (args.footer) {
      if (args.button) {
        components.push(component.section(`-# ${args.footer}`, component.button(args.button)))
      } else {
        components.push(`-# ${args.footer}`)
      }
    } else if (args.button) {
      components.push(component.button(args.button))
    }
    args.components = [component.container(message, {
      colour: args.colour,
      components
    })]
  }
  return args
}

registerFunction(scriptName, {
  async sendComponents(message, args, processing) {
    args = await setup(message, args)
    args.processing ??= processing
    return sendMessage(message, args)
  },
  async sendPrivateComponents(message, args, processing) {
    args = await setup(message, args)
    args.processing ??= processing
    return sendPrivateMessage(message, args)
  },
  async editComponents(message, args) {
    args = await setup(message, args)
    return editMessage(message, args)
  },
  async editPrivateComponents(message, args) {
    args = await setup(message, args)
    return editPrivateMessage(message, args)
  }
})