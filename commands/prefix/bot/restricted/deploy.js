const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, ContextMenuCommandBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders")

function setupOption(option, data, args) {
  const description = args?.description ?? data.description
  if (!description) throw Error(`Missing description for option \`${data.name}\``)
  option.setName(args?.name ?? data.id).setDescription(description).setRequired(data.required ? data.required : false).setAutocomplete?.(!!data.autocomplete || typeof data.options === "function")
  if (!data.autocomplete) {
    if (data.choices) option.setChoices(...data.choices.map(e => ({ name: e, value: e.toLowerCase() })))
    else if (Array.isArray(data.options)) option.setChoices(...data.options.map(e => ({ name: e, value: e.toLowerCase() })))
  }
  if (data.type === "integer" || data.type === "number") {
    if (defined(data.min)) option.setMinValue(data.min)
    if (defined(data.max)) option.setMaxValue(data.max)
  } else if (!data.type) {
    if (data.minLength) option.setMinLength(data.minLength)
    if (data.maxLength) option.setMaxLength(data.maxLength)
  }
  return option
}

function makeCommand(command, options) {
  const description = Array.isArray(options.description) ? options.description[0] : options.description
  if (description.length > 100) throw Error(`Slash command \`${options.name}\` description too long`)
  command.setName(options.name).setDescription(description.replace(/\.$/, ""))
  if (options.permissions.length && command.setDefaultMemberPermissions) {
    command.setDefaultMemberPermissions(options.permissions.map?.(e => getType.permission(e))?.reduce?.((a, e) => a | e, 0n))
  }
  if (options.guildOnly) command.setDMPermission?.(false)
  if (options.arguments) {
    for (const option of options.arguments) {
      try {
        if (option.type === "user" || option.type === "member") command.addUserOption(e => setupOption(e, option))
        else if (option.type === "number") command.addNumberOption(e => setupOption(e, option))
        else if (option.type === "integer") command.addIntegerOption(e => setupOption(e, option))
        else if (option.type === "boolean") command.addBooleanOption(e => setupOption(e, option))
        else if (option.type === "channel") command.addChannelOption(e => setupOption(e, option))
        else if (option.type === "role") command.addRoleOption(e => setupOption(e, option))
        else if (option.type === "attachment") command.addAttachmentOption(e => setupOption(e, option))
        else command.addStringOption(e => setupOption(e, option))
      } catch (err) {
        throw Error(`Slash command \`${options.name}\` ${err.message}`)
      }
    }
  }
  return command
}

async function loadCommands(parent, category, command) {
  const collection = parent.get(category[category.length - 1])
  const subCommands = []
  for (const file of fs.readdirSync(`./commands/slash/${category.join("/")}`)) {
    if (file.endsWith(".js")) {
      const subCommand = collection.get(file.slice(0, -3))
      subCommands.push(subCommand)
    } else if (!file.endsWith(".json")) {
      const options = JSON.parse(fs.readFileSync(`./commands/slash/${category.join("/")}/${file}/command.json`, "utf8"))
      const group = new SlashCommandSubcommandGroupBuilder().setName(file).setDescription(options.description)
      await loadCommands(collection, [...category, file], group)
      command.addSubcommandGroup(g => group.setName(file).setDescription(options.description))
    }
  }
  for (const options of subCommands) command.addSubcommand(subCommand => makeCommand(subCommand, options))
}

registerPrefixCommand(scriptName, prefixPath, {
  description: "Deploy the application commands.",
  permissions: ["BotOwner"],
  arguments: [{
    name: "type",
    description: "The deploy type",
    options: ["global", "guild"]
  }],
  async execute(message, deployType) {
    const processing = await sendProcessing(message)
    try {
      const commands = []

      for (const file of fs.readdirSync("./commands/slash")) {
        if (file.endsWith(".js")) {
          const command = client.slashCommands.get(file.slice(0, -3))
          commands.push(makeCommand(new SlashCommandBuilder(), command))
        } else {
          const options = JSON.parse(fs.readFileSync(`./commands/slash/${file}/command.json`, "utf8"))
          const command = new SlashCommandBuilder().setName(file).setDescription(options.description)
          if (options.permissions) command.setDefaultMemberPermissions(options.permissions.map?.(e => getType.permission(e))?.reduce?.((a, e) => a | e, 0n))
          if (options.guildOnly) command.setDMPermission(false)
          await loadCommands(client.slashCommands, [file], command)
          commands.push(command)
        }
      }

      for (const file of fs.readdirSync("./commands/context")) {
        const options = client.contextCommands.find(e => e.command === file.slice(0, -3))
        const command = new ContextMenuCommandBuilder().setName(options.name).setType(Discord.ApplicationCommandType[options.contextType ?? "Message"])
        if (options.permissions.length) command.setDefaultMemberPermissions(options.permissions.map?.(e => getType.permission(e))?.reduce?.((a, e) => a | e, 0n))
        if (options.guildOnly) command.setDMPermission(false)
        commands.push(command)
      }

      for (const command of commands) {
        if (command instanceof SlashCommandBuilder) {
          let size = 0
          function calculate(command) {
            size += command.name.length
            size += command.description.length
            if (command.options) {
              for (const option of command.options) {
                if (option instanceof SlashCommandSubcommandBuilder || option instanceof SlashCommandSubcommandGroupBuilder) {
                  calculate(option)
                } else {
                  size += option.name.length
                  size += option.description.length
                  if (option.choices) {
                    for (const choice of option.choices) {
                      size += choice.name.length
                      size += choice.value.length
                    }
                  }
                }
              }
            }
          }
          calculate(command)
          if (size > 4000) throw Error(`Slash command over character limit: \`${command.name}\` is at \`${size}\` characters`)
        }
      }

      const rest = new Discord.REST({ version: "10" }).setToken(tokens.discord)

      deployType ??= testMode ? "guild" : "global"

      if (deployType === "guild") {
        await rest.put(Discord.Routes.applicationGuildCommands(client.user.id, message.guildId), { body: commands })
      } else {
        await rest.put(Discord.Routes.applicationCommands(client.user.id), { body: commands })
      }

      sendMessage(message, {
        description: `Successfully registered \`${commands.length}\` application commands ${deployType === "guild" ? "to the server" : "globally"}`,
        processing
      })
    } catch (err) {
      console.error(err)
      sendError(message, {
        title: "There was an error while deploying application commands",
        description: err.message,
        processing
      })
    }
  }
})