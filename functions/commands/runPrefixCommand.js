let typingDisabledUntil = 0

async function sendTyping(channel) {
  if (Date.now() < typingDisabledUntil) return
  let timedOut = false
  await Promise.race([
    channel.sendTyping().catch(() => {}),
    new Promise(r => setTimeout(() => { timedOut = true; r() }, 3000))
  ])
  if (timedOut) typingDisabledUntil = Date.now() + 600000
}

registerFunction(scriptName, async (command, message, args) => {
  if (command.name !== "help" && args.length === 1 && args[0].toLowerCase() === "help") {
    args[0] = command.name
    command = client.prefixCommands.get("help")
  } else if (command.name !== "help" && args.length === 1 && args[0].toLowerCase().match(/^["“”]help["“”]$/)) args[0] = "help"
  if (await preCommand(message, command) !== true) return
  if (command.options?.quotes) args = Array.from(args.join(" ").matchAll(/(?<=^|(?<=\S)\s|["“”])(?:\s)*?([^\r\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"“”]+)|["“”]([^"“”]*)(?:["“”]|$)/g)).map(e => e[1] ?? e[2])
  if (!command.typingless) await sendTyping(message.channel)
  if (command.arguments) {
    try {
      let processing
      const argArray = []
      const restIndex = command.arguments[command.arguments.length - 1].rest ? command.arguments.length - 1 : -1
      if (restIndex !== -1 && args.length >= restIndex + 1) args = [].concat(args.slice(0, restIndex), args.slice(restIndex, args.length).join(" "))
      for (const [i, argument] of command.arguments.entries()) {
        if (argument.required && !args[i]) {
          let description = `Please enter: ${argument.name.quote()}${argument.description ? ` - ${argument.description}` : ""}`
          const extra = argTypes[argument.type]?.missing?.(argument, message)
          if (extra) description += `\n\n${extra}`
          return sendError(message, {
            title: "Missing required argument",
            description
          })
        }
        if (!args[i]) {
          if (defined(argument.default)) args[i] = argument.default
          else {
            argArray.push(null)
            continue
          }
        }
        let result
        if (argument.type !== "string") {
          result = await argTypes[argument.type](args[i], {
            message,
            unicode: true,
            processing
          }, argument)
          if (Array.isArray(result)) {
            [result, processing] = result
          }
          if (isMessageResponse(result) || result === null) return
          if (result === undefined) return sendError(message, {
            title: `Invalid argument type for ${argument.name.quote()}`,
            description: `${limit(args[i]).quote()} is not a valid ${argTypes[argument.type].displayName.quote()}`
          })
          args[i] = null
        } else {
          result = await argTypes.string(args[i], { message }, argument)
          if (isMessageResponse(result)) return
          args[i] = null
        }
        argArray.push(result)
      }
      args = argArray
      args.push(processing)
    } catch (err) {
      return commandError(message, err)
    }
  }
  if (command.singleUse) {
    client.commandInstances[command.name] ??= []
    client.commandInstances[command.name].push(message.channelId)
  }
  if (testMode) {
    await command.execute(message, ...args)
  } else {
    try {
      await command.execute(message, ...args)
    } catch (err) {
      return commandError(message, err)
    }
  }
  postCommand(message)
})