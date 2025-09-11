const aliases = new Set

registerFunction(scriptName, {
  registerArgType: (name, argType) => argTypes[name] = argType,
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
    let branch = { categories: client.commandTree }
    let currentPath = "./commands/prefix"
    for (const [i, parent] of command.parents.entries()) {
      currentPath += `/${parent}`
      if (!branch.categories[parent]) {
        const info = fs.existsSync(`${currentPath}/category.json`) ? JSON.parse(fs.readFileSync(`${currentPath}/category.json`, "utf8")) : null
        branch.categories[parent] = {
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
    if (command.cooldown === undefined && prefixCommand?.cooldown !== undefined) command.cooldown = prefixCommand.cooldown
    else if (command.cooldown === undefined) command.cooldown = 1
    if (!command.cooldownType && prefixCommand?.cooldownType) command.cooldownType = prefixCommand.cooldownType
    else if (!command.cooldownType) command.cooldownType = "guild"
    if (prefixCommand?.cooldowns) command.cooldowns = prefixCommand.cooldowns
    else command.cooldowns = {}
    command.permissions = prefixCommand?.permissions ?? []
    command.botPermissions = prefixCommand?.botPermissions ?? []
    if (!command.execute) command.execute = (interaction, ...args) => prefixCommand.execute(interaction, args)
    if (command.options) for (const option of command.options) if (!option.type) option.type = "string"
    if (prefixCommand) prefixCommand.slashCommand = command
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
    if (command.cooldown === undefined && prefixCommand.cooldown !== undefined) command.cooldown = prefixCommand.cooldown
    else if (command.cooldown === undefined) command.cooldown = 1
    if (!command.cooldownType && prefixCommand.cooldownType) command.cooldownType = prefixCommand.cooldownType
    else if (!command.cooldownType) command.cooldownType = "guild"
    if (prefixCommand.cooldowns) command.cooldowns = prefixCommand.cooldowns
    else command.cooldowns = {}
    command.permissions = prefixCommand?.permissions ?? []
    command.botPermissions = prefixCommand?.botPermissions ?? []
    if (!command.execute) command.execute = (interaction, ...args) => prefixCommand.execute(interaction, args)
    prefixCommand.contextCommand = command
    command.prefixCommand = prefixCommand
    client.contextCommands.set(command.name.toTitleCase(true), command)
  },
  registerAutocomplete: (name, execute) => client.autocompletes.set(name, { name, execute }),
  registerEvent(name, event) {
    const func = (...args) => {
      if (client.isReady()) event(...args)
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