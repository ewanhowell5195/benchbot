registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "View the posts that awarded a user the Modeling Enthusiast role",
    arguments: "[title]"
  },
  aliases: ["posts", "submissions"],
  arguments: ["?*member:member"],
  async execute(message, args) {
    if (!args[0]) args[0] = message.member
    const posts = db.users.popularPosts.get(args[0].id).slice(0, config.likes.posts).map((e, i) => ({
      label: `Post ${i + 1}`,
      url: `https://discord.com/channels/${config.guild}/${config.channels.archive}/${e}`
    }))
    if (!posts.length) {
      return sendMessage(message, {
        title: "No posts",
        description: `${args[0] === message.member ? "You do" : `${args[0]} does`} not have any Modeling Enthusiast worthy posts`,
        fields: [["Requirements", `You require 40 likes on 4 unique posts to earn the <@&${config.roles.modelingEnthusiast}> role`]]
      })
    }
    const components = []
    let items = posts.slice()
    while (items.length) {
      const buttons = items.slice(0, 5)
      items = items.slice(5)
      components.push(makeRow({ buttons }))
    }
    if (posts.length < config.likes.posts) return sendMessage(message, {
      title: `${message.member === args[0] ? "You" : "They"} are getting there!`,
      description: `${message.member === args[0] ? "You" : args[0]} need${message.member === args[0] ? "" : "s"} ${config.likes.posts - posts.length} more post${config.likes.posts - posts.length === 1 ? "" : "s"} with at least ${config.likes.reactions} likes each to earn the <@&${config.roles.modelingEnthusiast}> role`,
      components
    })
    sendMessage(message, {
      author: ["Role awarded!", client.icons.medalGreen],
      description: `These are the posts that awarded ${message.member === args[0] ? "you" : args[0]} the <@&${config.roles.modelingEnthusiast}> role!`,
      components
    })
  }
})