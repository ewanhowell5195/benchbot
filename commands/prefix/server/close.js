registerPrefixCommand(scriptName, prefixPath, {
  description: "Close the current help post.",
  typingless: true,
  guildOnly: true,
  aliases: ["closethread", "threadclose", "closepost", "closeforum", "postclose", "forumclose", "setarchived"],
  botPermissions: ["ManageThreads"],
  async execute(message, args) {
    if (!isType.channel(message.channel, "Thread")) return sendError(message, {
      title: "Unsupported channel type",
      description: "This command can only be run in a thread"
    })
    if (!message.channel.parent.name.startsWith("help-") && message.author.id !== message.channel.ownerId && !hasPerm(message.member, "ManageMessages", message.channel)) return sendError(message, {
      title: "Missing required permissions",
      description: "You need either be the thread owner, or have the `Manage Threads` permission to run that command"
    })
    await react(message, client.emotes.success)
    message.channel.setArchived()
  }
})