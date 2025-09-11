registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "View and get details about Blockbench plugins.",
    arguments: "[plugin]"
  },
  aliases: ["plugins"],
  arguments: ["*?plugin"],
  async execute(message, args) {
    const processing = await sendProcessing(message)
    const plugins = await cache.plugins()
    if (!args[0]) return sendMessage(message, {
      title: "Available Blockbench Plugins",
      description: `Use \`${getCommandName(message)} [plugin]\` to view the details about a specific plugin\n\n${quoteList(Object.values(plugins).map(e => e.title).sort())}`,
      deletable: true,
      processing
    })
    const pluginList = Object.values(plugins).map(e => e.title).concat(Object.keys(plugins))
    const closest = closestMatch(args[0], pluginList)
    if (!closest) return sendError(message, {
      title: "Unknown plugin",
      description: `The plugin \`${args[0].limit()}\` was not found.\n\n**Available Blockbench Plugins**\n\n${quoteList(Object.values(plugins).map(e => e.title).sort())}`,
      processing
    })
    const plugin = Object.entries(plugins).find(e => e[0] === closest || e[1].title === closest)
    const fields = [
      plugin[1].tags ? ["Tags", `\`${plugin[1].tags.join("`, `")}\``]: undefined,
      ["Downloads over the last 2 weeks", `\`${plugin[1].stats.toLocaleString()}\``]
    ]
    if (plugin[0] === "minecraft_title_generator") {
      const stats = await cache.minecraftTitleGenerator()
      let length = 0
      const popular = stats[0].filter(e => e.id.includes(".")).map(e => {
        const split = e.id.split(".")
        return {
          id: split,
          count: stats[2].overlays[split[1]] ? 0 : e.count
        }
      }).sort((a, b) => b.count - a.count).filter(e => e.count).slice(0, 5).map(e => {
        e.id = `${e.id[0].toTitleCase(true)}: ${stats[2][e.id[0]]?.textures[e.id[1]].name ?? e.id[1].toTitleCase(true)}`
        return e
      }).map(e => {
        length = Math.max(length, e.id.length)
        return e
      }).map(e => `\`${e.id.padEnd(length)}\` - \`${e.count.toLocaleString()}\``).join("\n")
      length = 0
      const popularAll = stats[1].filter(e => e.id.includes(".")).map(e => {
        const split = e.id.split(".")
        return {
          id: split,
          count: stats[2].overlays[split[1]] ? 0 : e.count
        }
      }).sort((a, b) => b.count - a.count).filter(e => e.count).slice(0, 5).map(e => {
        e.id = `${e.id[0].toTitleCase(true)}: ${stats[2][e.id[0]]?.textures[e.id[1]].name ?? e.id[1].toTitleCase(true)}`
        return e
      }).map(e => {
        length = Math.max(length, e.id.length)
        return e
      }).map(e => `\`${e.id.padEnd(length)}\` - \`${e.count.toLocaleString()}\``).join("\n")
      fields.push(
        ["Titles generated this week", `\`${stats[0].filter(e => !e.id.includes(".") || e.id.startsWith("tileable.")).reduce((a, e) => a + e.count, 0).toLocaleString()}\``],
        ["Popular textures this week", popular],
        ["Titles generated all time", `\`${stats[1].filter(e => !e.id.includes(".") || e.id.startsWith("tileable.")).reduce((a, e) => a + e.count, 0).toLocaleString()}\``],
        ["Popular textures all time", popularAll]
      )
    } else if (plugin[0] === "cem_template_loader") {
      const cem = await cache.cem()
      let length = 0
      fields.push(["Template model counts", cem.categories.map(e => {
        length = Math.max(length, e.name.length)
        return e
      }).map(e => `\`${e.name.padEnd(length)}\` - \`${e.entities.length}\``).join("\n")])
    }
    sendMessage(message, {
      title: plugin[1].title,
      description: plugin[1].description,
      fields: fields.filter(e => e),
      thumbnail: plugin[1].icon.endsWith(".png") ? `https://cdn.jsdelivr.net/gh/JannisX11/blockbench-plugins/plugins/${plugin[0]}/${plugin[1].icon}` : undefined,
      footer: [`By ${plugin[1].author}${plugin[1].creation_date ? " - Released" : ""}`],
      timestamp: Date.parse(plugin[1].creation_date),
      components: [makeRow({
        buttons: [
          {
            label: "View Plugin",
            url: `https://www.blockbench.net/plugins/${plugin[0]}`
          },
          plugin[1].variant === "desktop" ? undefined : {
            label: "Install in web app",
            url: `https://web.blockbench.net/?plugins=${plugin[0]}`
          }
        ].filter(e => e)
      })],
      processing
    })
  }
})