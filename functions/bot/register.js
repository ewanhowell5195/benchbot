const aliases = new Set

registerFunction(scriptName, {
  registerArgType(name, argType) {
    let displayName
    if (typeof argType !== "function") {
      displayName = argType.name?.toTitleCase(true)
    }
    if (!displayName) {
      displayName = name.toTitleCase(true)
    }
    argTypes[name] = async function(item, data, args = {}) {
      const get = await argTypes[name].get(item, data, args)
      if (isMessageResponse(get) || !defined(get)) return get
      const valid = await argTypes[name].validate(get, data, args)
      if (valid === true) return get
      return valid
    }
    if (typeof argType === "function") {
      argTypes[name].get = argType
      argTypes[name].validate = () => true
    } else {
      argTypes[name].get = argType.get
      if (argType.validate) {
        argTypes[name].validate = argType.validate
      } else {
        argTypes[name].validate = () => true
      }
    }
    argTypes[name].missing = argType.missing
    argTypes[name].renderDetails = argType.render
    argTypes[name].render = args => {
      const details = {
        type: displayName
      }
      if (defined(args.default)) {
        details.Default = args.default
      }
      argType.render?.(details, args)
      let str = `- ${args.required ? "*" : ""}**${args.id}** : `
      if (argType.link) {
        str += `[${details.type}](${argType.link})`
      } else {
        str += details.type
      }
      if (args.description) {
        str += `\n  - ${args.description}`
      }
      const flags = Object.entries(details).filter(e => e[0] !== "type").map(([k, v]) => v === true && k !== "Default" ? `**${k}**` : `**${k}**: ${v}`)
      for (const flag of flags) {
        str += `\n  - ${flag}`
      }
      return str
    }
    argTypes[name].autocomplete = argType.autocomplete
    argTypes[name].displayName = displayName
    argTypes[name].description = argType.description
  },
  registerPrefixCommand(name, categories, command) {
    for (const category of categories) client.prefixCategories.add(category)
    command.type = "prefix"
    command.prefix = true
    command.name = name
    command.command = name
    command.parents = categories
    if (client.prefixCommands.get(name)) throw Error(`The command "${name}" is already in use`)
    if (command.aliases) {
      for (const alias of command.aliases) {
        if (aliases.has(alias)) throw Error(`The command "${name}" has the alias "${alias}", which is already an alias of "${client.prefixCommands.get(alias).name}"`)
        if (client.prefixCommands.get(alias)) throw Error(`The command "${name}" has the alias "${alias}", which is already in use as a command name`)
        aliases.add(alias)
        if (!command.parents.includes("restricted")) client.fullCommandList.push(alias)
      }
    }
    if (command.cooldown === undefined) command.cooldown = 1
    if (!command.cooldownType) command.cooldownType = "guild"
    command.cooldowns = {}
    if (!command.permissions) command.permissions = []
    if (!command.botPermissions) command.botPermissions = []
    if (command.arguments) {
      let requiredCheck
      for (const argument of command.arguments) {
        argument.type ??= "string"
        argument.name = argument.name || argTypes[argument.type].displayName
        argument.id = argument.name.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll(" ", "-").toLowerCase()
        argument.name = argument.name.toTitleCase(true)
        if (!argument.required) requiredCheck = true
        else if (requiredCheck && argument.required) throw Error(`The command "${name}" has required arguments after non-required arguments`)
        if (argument.allowedCharacters) {
          argument.allowedCharactersRegex = new RegExp(`[^${argument.allowedCharacters}]`, "i")
          argument.allowedCharacters = argument.allowedCharacters.replace("\\\\", "\\")
          if (argument.allowedCharacters.includes("\\n")) argument.allowedCharacters = argument.allowedCharacters.replace("\\n", "") + " newline"
          if (argument.allowedCharacters.includes("\s")) argument.allowedCharacters = argument.allowedCharacters.replace("\s", "") + " space"
        }
        if (argument.disallowedCharacters) {
          argument.disallowedCharactersRegex = new RegExp(`[${argument.disallowedCharacters}]`, "i")
          argument.disallowedCharacters = argument.disallowedCharacters.replace("\\\\", "\\")
          if (argument.disallowedCharacters.includes("\\n")) argument.disallowedCharacters = argument.disallowedCharacters.replace("\\n", "") + " newline"
          if (argument.disallowedCharacters.includes("\s")) argument.disallowedCharacters = argument.disallowedCharacters.replace("\s", "") + " space"
        }
      }
      if (!command.arguments.find(e => defined(e.rest))) {
        const arg = command.arguments[command.arguments.length - 1]
        if (!["integer", "number", "boolean", "url"].includes(arg.type)) {
          arg.rest = true
        }
      }
    }
    let branch = { categories: client.commandTree }
    let currentPath = "./commands/prefix"
    for (const [i, parent] of command.parents.entries()) {
      currentPath += `/${parent}`
      if (!branch.categories[parent]) {
        const info = fs.existsSync(`${currentPath}/category.json`) ? JSON.parse(fs.readFileSync(`${currentPath}/category.json`, "utf8")) : null
        branch.categories[parent] = {
          name: parent,
          categories: {},
          commands: [],
          parents: command.parents.slice(0, i),
          description: info?.description,
          extra: info?.extra
        }
      }
      if (!client.categories[parent]) client.categories[parent] = branch.categories[parent]
      branch = branch.categories[parent]
    }
    branch.commands.push(command)
    if (categories.includes("restricted")) client.restrictedCommands.push(name)
    client.prefixCommands.set(name, command)
    if (command.aliases) for (const alias of command.aliases) client.prefixCommands.set(alias, command)
    if (!command.parents.includes("restricted")) {
      client.fullCommandList.push(name)
      client.stats.prefixCommandCount++
    }
  },
  registerSlashCommand(name, categories, command) {
    let collection = client.slashCommands
    for (const c of categories) {
      collection = collection.get(c)
    }
    command.type = "slash"
    command.slash = true
    command.application = true
    command.name = name
    command.tree = [...categories, name]
    if (!command.command) command.command = name
    const prefixCommand = client.prefixCommands.get(command.command)
    if (prefixCommand) {
      prefixCommand.slashCommand = command
      command.cooldowns = prefixCommand.cooldowns
      command.permissions ??= prefixCommand.permissions
      command.botPermissions ??= prefixCommand.botPermissions
      command.requirement ??= prefixCommand.requirement
      command.guildOnly ??= prefixCommand.guildOnly
      if (command.cooldown === undefined && prefixCommand.cooldown !== undefined) command.cooldown = prefixCommand.cooldown
      if (!command.arguments && prefixCommand.arguments) command.arguments = prefixCommand.arguments.filter(e => !e.hidden)
      if (!command.cooldownType && prefixCommand.cooldownType) command.cooldownType = prefixCommand.cooldownType
      if (prefixCommand.singleUse) command.singleUse = true
      if (!command.description) command.description = Array.isArray(prefixCommand.description) ? prefixCommand.description[0] : prefixCommand.description
      if (prefixCommand.autoClearCooldown === false) command.autoClearCooldown = false
      if (!command.execute) {
        if (command.arguments) command.execute = prefixCommand.execute
        else command.execute = (interaction, ...args) => prefixCommand.execute(interaction, args)
      }
    } else {
      command.cooldowns = {}
      command.permissions ??= []
      command.botPermissions ??= []
      if (command.cooldown === undefined) command.cooldown = 1
      if (!command.cooldownType) command.cooldownType = "guild"
    }
    if (command.arguments) {
      for (const argument of command.arguments) {
        argument.type ??= "string"
        argument.name = argument.name || argTypes[argument.type].displayName
        argument.id ??= argument.name.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll(" ", "-").toLowerCase()
        argument.name = argument.name.toTitleCase(true)
        argument.description ??= argTypes[argument.type]?.description
        if (!argument.autocomplete && argTypes[argument.type]?.autocomplete) {
          argument.autocomplete = argTypes[argument.type].autocomplete
        }
      }
    }
    command.installType ??= collection.data.installType ?? "guild"
    command.prefixCommand = prefixCommand
    collection.set(name, command)
    client.stats.slashCommandCount++
  },
  registerContextCommand(name, command) {
    command.type = "context"
    command.context = true
    command.application = true
    if (!command.name) command.name = name
    if (!command.command) command.command = name
    const prefixCommand = client.prefixCommands.get(command.command)
    if (prefixCommand) {
      command.permissions ??= prefixCommand.permissions
      command.botPermissions ??= prefixCommand.botPermissions
      command.requirement ??= prefixCommand.requirement
      command.guildOnly ??= prefixCommand.guildOnly
      if (command.cooldown === undefined && prefixCommand.cooldown !== undefined) command.cooldown = prefixCommand.cooldown
      if (!command.cooldownType && prefixCommand.cooldownType) command.cooldownType = prefixCommand.cooldownType
      if (prefixCommand.cooldowns) command.cooldowns = prefixCommand.cooldowns
      if (!command.execute) command.execute = prefixCommand.execute
      prefixCommand.contextCommand = command
      if (prefixCommand.autoClearCooldown === false) command.autoClearCooldown = false
      command.prefixCommand = prefixCommand
      if (!command.description) command.description = prefixCommand.description
    } else {
      command.cooldowns = {}
      command.permissions ??= []
      command.botPermissions ??= []
      if (command.cooldown === undefined) command.cooldown = 1
      if (!command.cooldownType) command.cooldownType = "guild"
    }
    client.contextCommands.set(command.name.toTitleCase(true), command)
  },
  registerAutocomplete: (name, execute) => client.autocompletes.set(name, { name, execute }),
  registerEvent(name, event) {
    const func = (...args) => {
      if (client.isReady() && !reloading) event(...args)
    }
    loadedEvents.set(name, func)
    client.on(name, func)
  },
  async registerLoadIn(name, loadIn) {
    let loaded
    loadIn.loaded = new Promise(fulfil => loaded = fulfil)
    loadedLoadIns.set(name, loadIn)
    await loadIn.load()
    loaded()
  }
})