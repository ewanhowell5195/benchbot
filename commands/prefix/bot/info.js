registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Get some information about the bot."
  },
  aliases: ["botinformation", "botinfo", "information", "binfo", "about"],
  async execute(message) {
    const creator = await client.users.fetch(config.owners[0])
    const fields = [
      ["Prefix", config.prefix, true],
      ["Uptime", client.totalUptime, true],
      ["Command count", client.stats.prefixCommandCount.toLocaleString(), true],
      ["Library", `[discord.js v${Discord.version}](https://github.com/discordjs/discord.js/releases/tag/${Discord.version})`, true]
    ]
    sendMessage(message, {
      title: client.user.displayName,
      description: "The official Blockbench Discord bot",
      author: ["Info", client.icons.discord],
      footer: [`Created by ${creator.username}`, avatar(creator)],
      thumbnail: avatar(client.user),
      image: client.user.bannerURL({
        extension: getType.image("PNG"),
        size: 4096
      }),
      fields
    })
  }
})