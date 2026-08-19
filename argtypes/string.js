registerArgType(scriptName, {
  async get(item, data, args) {
    if (args.lowerCase) item = item.toLowerCase()
    if (args.options) {
      let options
      if (typeof args.options === "function") options = args.options(data.message)
      else options = args.options
      if (!options.length) {
        return sendError(data.message, {
          title: `No available options for ${args.name.quote()}`,
          description: `There are currently no available options for ${args.name.quote()}`
        })
      } else if (typeof options === "string") {
        return sendError(data.message, {
          title: `No available options for ${args.name.quote()}`,
          description: options
        })
      }
      const lower = item.toLowerCase()
      const option = options.find(e => e.toLowerCase() === lower)
      if (!option) return sendError(data.message, {
        title: `Invalid option for ${args.name.quote()}`,
        description: `${limit(item.toString()).quote()} is not a valid option for ${args.name.quote()}`,
        fields: [["Available Options", quoteList(options)]]
      })
      item = option
    }
    if (args.replaceMentions) {
      item = await replaceDiscordMentions(data.message.guild, item)
    }
    return item.userTrim()
  },
  missing(args, message) {
    const options = typeof args.options === "function" ? args.options(message) : args.options
    if (Array.isArray(options) && options.length && options.length <= 25) {
      return `The available options are:\n${quoteList(options)}`
    }
  },
  validate(item, data, args) {
    if (args.minLength && item.length < args.minLength) return sendError(data.message, {
      title: `${args.name.quote()} too short`,
      description: `${limit(item).quote()} is too short. The minimum length is ${args.minLength.quote()} characters.`
    })
    if (args.maxLength && item.length > args.maxLength) return sendError(data.message, {
      title: `${args.name.quote()} too long`,
      description: `${limit(item).quote()} is too long. The maximum length is ${args.maxLength.quote()} characters.`
    })
    if (args.allowedCharacters) {
      const check = item.match(args.allowedCharactersRegex)
      if (check) return sendError(data.message, {
        title: `${args.name.quote()} contains unsupported characters`,
        description: `The character ${check[0].replace("\n", "newline").replace(" ", "space").quote()} is not supported.\nAllowed characters: ${args.allowedCharacters.quote()}`
      })
    }
    if (args.disallowedCharacters) {
      const check = item.match(args.disallowedCharactersRegex)
      if (check) return sendError(data.message, {
        title: `${args.name.quote()} contains unsupported characters`,
        description: `The character ${check[0].replace("\n", "newline").replace(" ", "space").quote()} is not supported.\nUnsupported characters: ${args.disallowedCharacters.quote()}`
      })
    }
    return true
  },
  render(details, args) {
    details.type = "Text"
    if (args.minLength && args.maxLength) {
      details["Allowed length"] = `${args.minLength}–${args.maxLength} characters`
    } else {
      if (args.minLength) {
        details["Minimum length"] = `${args.minLength} character${plural(args.minLength)}`
      }
      if (args.maxLength) {
        details["Maximum length"] = `${args.maxLength} character${plural(args.maxLength)}`
      }
    }
    if (args.allowedCharacters) {
      details["Allowed characters"] = args.allowedCharacters.quote()
    }
    if (args.disallowedCharacters) {
      details["Disallowed characters"] = args.disallowedCharacters.quote()
    }
    if (Array.isArray(args.options)) {
      details["Available options"] = quoteList(args.options)
    }
  }
})