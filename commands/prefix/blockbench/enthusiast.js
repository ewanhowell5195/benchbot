registerPrefixCommand(scriptName, prefixPath, {
  description: "View the posts that awarded a user the Modeling Enthusiast role",
  aliases: ["posts", "submissions"],
  arguments: [{
    type: "member",
    name: "member",
    description: "The member to check"
  }],
  async execute(message, member) {
    member ??= message.member
    const posts = db.users.popularPosts.get(member.id).slice(0, config.likes.posts).map((e, i) => ({
      label: `Post ${i + 1}`,
      url: `https://discord.com/channels/${config.guild}/${config.channels.archive}/${e}`
    }))
    if (!posts.length) {
      return sendMessage(message, {
        title: "No posts",
        description: `${member === message.member ? "You do" : `${member} does`} not have any Modeling Enthusiast worthy posts`,
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
      title: `${message.member === member ? "You" : "They"} are getting there!`,
      description: `${message.member === member ? "You" : member} need${message.member === member ? "" : "s"} ${config.likes.posts - posts.length} more post${config.likes.posts - posts.length === 1 ? "" : "s"} with at least ${config.likes.reactions} likes each to earn the <@&${config.roles.modelingEnthusiast}> role`,
      components
    })
    sendMessage(message, {
      author: ["Role awarded!", client.icons.medalGreen],
      description: `These are the posts that awarded ${message.member === member ? "you" : member} the <@&${config.roles.modelingEnthusiast}> role!`,
      components
    })
  }
})