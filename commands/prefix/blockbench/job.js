registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Creates a new job post."
  },
  aliases: ["newjob", "jobnew"],
  async execute(message) {
    let member = message.member
    if (!member.guild) {
      const guild = client.guilds.cache.get(config.guild)  
      member = await guild.members.fetch(message.author.id)
    }

    if (!member) {
      return sendError(message, {
        title: "Not in server",
        description: "You must be in the Blockbench server to use this command"
      })
    }

    if (!member.roles.cache.has(config.roles.jobs)) {
      return sendError(message, {
        title: "Missing job channel access",
        description: `You must get access to the job channels before you can use this command\n\nGo to <#${config.channels.job.info}> to get access`
      })
    }

    const start = await choose(message, {
      description: "Hello! Thank you for being interested in creating a job post! I will guide you through some questions for creating your job post. If you want to cancel the job post creation at any time, just ignore this message and it will time out.\n\n## Important\nThe job channels are just bulletin boards. The server team does not review or manage job posts. It is your responsibility to resolve potential issues with clients/artists.",
      options: ["Start!"],
      keep: true
    })
    if (!start) return
    let processing = start[1]

    async function askSimple(args) {
      const ask = await choose(message, {
        description: args.question,
        options: args.options,
        message: processing,
        keep: true
      })
      if (!ask) return
      processing = ask[1]
      return args.options[parseInt(ask[0])]
    }

    async function askDetailed(args, func) {
      processing = await sendMessage(message, {
        description: args.question,
        fields: args.fields,
        components: [makeRow({
          buttons: [
            {
              label: args.button ?? "Answer",
              emoji: client.emotes.pencilWhite,
              customId: "modal"
            },
            args.skippable ? {
              label: "Skip",
              emoji: client.emotes.arrowRightWhite,
              customId: "skip"
            } : undefined
          ].filter(e => e)
        })],
        fetch: true,
        processing
      })
      if (!await modalHandler(message, processing, {
        title: `Job Creator - ${args.title}`,
        rows: args.options.map(e => {
          e.required = true
          e.invalidChars = /\\|`/
          return { text: e }
        })
      }, fields => {
        func(fields)
        return true
      }, {
        authorOnly: true,
        leave: true,
        timeout: 600
      }, interaction => true)) return
      return true
    }

    const type = await askSimple({
      question: "Are you looking for **__work__**, or are you looking for an **__artist__**?",
      options: ["Work", "Artist"]
    })
    if (!type) return
    const job = {}
    if (type === "Artist") {
      job.channel = config.channels.job.job
      job.position = await askSimple({
        question: "Are you offering a **__single__** commission or a **__long-term__** position? Or do you offer **__both__**?",
        options: ["Single", "Long-term", "Both"]
      })
      if (!job.position) return
      if (!await askDetailed({
        title: "Asset Type",
        question: "What type of assets do you need? For example, a **__texture__**, **__model__**, **__animation__**, **__build__**, etc…",
        options: [{
          id: "assetType",
          label: "Asset Type",
          placeholder: "texture / model / animation / build / etc",
          maxLength: 32,
          minLength: 5
        }]
      }, fields => job.assetType = fields.assetType)) return
      job.paid = await askSimple({
        question: "Are you able to pay the artist?",
        options: ["Yes", "No"]
      })
      if (!job.paid) return
      if (job.paid === "No") job.channel = config.channels.job.project
      job.company = await askSimple({
        question: "Are you recruiting for a team or company?",
        options: ["Yes", "No"]
      })
      if (!job.company) return
      if (!await askDetailed({
        title: "Tell me a bit more…",
        question: "Tell me a bit more…",
        fields: [
          [`About the ${job.position === "Single" ? "job" : "position"}`, `Tell me a bit about the ${job.position === "Single" ? "job" : "position"}, and what you would like from it.`],
          [job.company === "Yes" ? "About your team or company" : "About yourself", `Tell me a bit about ${job.company === "Yes" ? "your team or company, and what you do." : "yourself.\n\nDetailed information can help make people interested in your project. Here are some questions for orientation:\n- What do you do, what do you specialize in?\n- How much experience do you have?\n- Have you worked on and finished any projects in the past?"}`]
        ],
        options: [
          {
            id: "description",
            label: `About the ${job.position === "Single" ? "job" : "position"}`,
            placeholder: "I am offering…",
            maxLength: 1024,
            minLength: 32,
            long: true
          },
          {
            id: "about",
            label: job.company === "Yes" ? "About your team or company" : "About yourself",
            placeholder: job.company === "Yes" ? "We are a team/company that…" : "I am a person that…",
            maxLength: 1024,
            minLength: 32,
            long: true
          }
        ]
      }, fields => {
        job.description = fields.description
        job.about = fields.about
      })) return
      if (job.position === "Single") job.mergedDescription = `a ${job.paid === "Yes" ? "paid" : "voluntary"} artist for a single ${job.assetType} job!`
      else if (job.position === "Long-term") job.mergedDescription = `a longer term ${job.paid === "Yes" ? "paid" : "voluntary"} ${job.assetType} artist`
      else job.mergedDescription = `a ${job.paid === "Yes" ? "paid" : "voluntary"} ${job.assetType} artist`
      job.embeds = [{
        author: [`Job post by ${message.member.displayName}`, avatar(message.member)],
        description: `### ${message.author} is looking for ${job.mergedDescription}.`,
        fields: [
          [`About ${job.company === "Yes" ? "us" : "me"}`, job.about],
          [`About the ${job.position === "Single" ? "commission" : "position"}`, job.description]
        ]
      }]
    } else {
      job.channel = config.channels.job.artist
      job.position = await askSimple({
        question: "Are you looking for a **__single__** commission or a **__long-term__** position? Or do you accept **__both__**?",
        options: ["Single", "Long-term", "Both"]
      })
      if (!job.position) return
      if (!await askDetailed({
        title: "Tell me a bit more…",
        question: "Tell me a bit more…",
        fields: [
          ["What type of assets are you creating?", "For example, **__textures__**, **__models__**, **__animations__**, **__builds__**, etc…"],
          ["Your portfolio", "Please link your portfolio. This can be your website, your sketchfab page or something else that displays your work."],
          ["Your rate", "What is the rate that you charge for your work?"],
          ["About yourself", "Tell me a bit about yourself. What is your experience and what kind of job are you looking for?"]
        ],
        options: [
          {
            id: "assetType",
            label: "Asset Type",
            placeholder: "textures / models / animations / builds / etc",
            maxLength: 32,
            minLength: 5
          },
          {
            id: "portfolio",
            label: "Your Portfolio",
            placeholder: "https://sketchfab.com/jannisx11",
            type: "url"
          },
          {
            id: "rate",
            label: "Your Rate",
            placeholder: "$15/h",
            maxLength: 16,
            minLength: 3
          },
          {
            id: "about",
            label: "About yourself",
            placeholder: "I am a person that…",
            maxLength: 1024,
            minLength: 32,
            long: true
          }
        ]
      }, fields => {
        job.assetType = fields.assetType
        job.portfolio = fields.portfolio
        job.rate = fields.rate
        job.about = fields.about
      })) return
      if (!await askDetailed({
        title: "Showcase Images",
        question: "Would you like to add some showcase images?",
        button: "Add images",
        skippable: true,
        options: [
          {
            id: "image0",
            label: "Image 1",
            placeholder: "https://cdn.discordapp.com/embed/avatars/0.png",
            type: "url"
          },
          {
            id: "image1",
            label: "Image 2",
            placeholder: "https://cdn.discordapp.com/embed/avatars/1.png",
            type: "url"
          },
          {
            id: "image2",
            label: "Image 3",
            placeholder: "https://cdn.discordapp.com/embed/avatars/2.png",
            type: "url"
          },
          {
            id: "image3",
            label: "Image 4",
            placeholder: "https://cdn.discordapp.com/embed/avatars/3.png",
            type: "url"
          }
        ]
      }, fields => job.images = Object.values(fields))) return
      const assets = job.assetType.split(/,|and|or|\//)
      job.embeds = [{
        url: job.images?.[0],
        author: [`Artist post by ${message.member.displayName}`, avatar(message.member)],
        description: `### ${message.author} offers to create ${assets.map((e, i) => `${i && i === assets.length - 1 ? "and " : ""}${e.trim()}`).join(", ").replace(", and", " and")}.`,
        fields: [
          ["Type", job.position === "Single" ? "Comission" : job.position === "Long-term" ? "Longer-Term Position" : "Single or Longer-Term"],
          ["Rate", job.rate],
          ["Description", job.about],
          ["Portfolio", job.portfolio]
        ],
        image: job.images?.[0]
      }]
      if (job.images) for (const image of job.images.slice(1, 4)) {
        job.embeds.push({
          url: job.images[0],
          image: image
        })
      }
    }
    check = await confirm(message, {
      description: `Here is a preview of your job post. It will be posted in <#${job.channel}>\n\nDo you want to submit the job post?`,
      embeds: job.embeds,
      processing
    })
    if (!check[0]) return editMessage(check[1], {
      description: "The job post has been aborted"
    })
    processing = check[1]
    const sent = await sendMessage(await getChannel(job.channel), { embeds: job.embeds })
    sendMessage(message, {
      description: `Your job has been posted!\n\nIf you want to remove the job post, you can react with <:delete:${config.emotes.delete}> to remove it.`,
      components: [makeRow({
        buttons: [{
          label: "Jump to post…",
          url: `https://discord.com/channels/${sent.guildId}/${sent.channelId}/${sent.id}`
        }]
      })],
      processing
    })
  }
})