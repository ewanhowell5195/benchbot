registerFunction(scriptName, async message => {
  const name = message.command.command ?? message.command.name
  if (client.commandInstances[name]?.includes(message.channelId)) {
    client.commandInstances[name].splice(client.commandInstances[name].indexOf(message.channelId), 1)
    if (!client.commandInstances[name].length) delete client.commandInstances[name]
  }
  if (message.command.autoClearCooldown !== false) clearCooldown(message)
})