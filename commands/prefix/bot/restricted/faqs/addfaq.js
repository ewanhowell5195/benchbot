registerPrefixCommand(scriptName, prefixPath, {
  description: "Add or update an FAQ entry.",
  guildOnly: true,
  permissions: ["ManageMessages"],
  aliases: ["faqadd", "setfaq", "faqset"],
  async execute(message) {
    let faq
    const modal = await modalHandler(message, undefined, {
      prompt: {
        description: "Press the button to start creating an FAQ",
        button: {
          label: "Create an FAQ",
          emoji: client.emotes.pencilWhite,
          id: "modal"
        }
      },
      modal: {
        title: "FAQ Builder",
        rows: [
          {
            label: "FAQ Category",
            invalidChars: /\\|`|"|“|”/,
            func: e => e.toLowerCase().replace(/_|\s/g, "-"),
            component: component.input({
              id: "category",
              maxLength: 32,
              placeholder: "The category for the FAQ",
              required: true
            })
          },
          {
            label: "FAQ ID",
            func: e => e.toLowerCase().replace(/_|\s/g, "-"),
            component: component.input({
              id: "id",
              maxLength: 32,
              placeholder: "The ID for the FAQ",
              required: true
            })
          },
          {
            label: "FAQ Text",
            component: component.input({
              id: "text",
              placeholder: "The text for the FAQ",
              long: true,
              required: true
            })
          }
        ]
      },
      async onSubmit(fields) {
        faq = {
          category: fields.category,
          id: fields.id,
          text: await insertDiscordMentions(message.guild, fields.text),
          data: {}
        }
        return true
      }
    })
    if (modal.timeout) return
    const target = modal.interaction ?? message
    let modalMessage = modal.message
    let check
    const existing = db.faq.get(faq.category, faq.id)
    if (existing) {
      check = await confirm(target, {
        description: `The FAQ ${faq.id.quote()} already exists in the ${faq.category.quote()} category\n\nAre you sure you want to replace it?`,
        danger: true,
        cv2: true,
        processing: modalMessage
      })
      if (!check[0]) return editComponents(check[1], "The FAQ replacement has been aborted")
      modalMessage = check[1]
      faq.data = existing.data
    }
    const modal2 = await modalHandler(target, modalMessage, {
      prompt: [
        component.text("Press a button to continue creating the FAQ"),
        component.row(
          component.button({
            label: "Extra FAQ options",
            emoji: client.emotes.pencilWhite,
            id: "modal"
          }),
          component.button({
            label: "Skip",
            id: "skip",
            emoji: client.emotes.arrowRightWhite
          })
        )
      ],
      modal: {
        title: "FAQ Builder",
        rows: [
          {
            label: "Embed",
            description: "Should the FAQ be shown in an embed?",
            component: component.checkbox({
              id: "embed",
              default: true
            })
          },
          {
            label: "Image URL",
            type: "url",
            component: component.input({
              id: "image",
              maxLength: 256,
              placeholder: "An image to show alongside the FAQ"
            })
          },
          {
            label: "FAQ ID aliases",
            invalidChars: /\\|`|"|“|”/,
            func(item, fields) {
              item = new Set(item.toLowerCase().split(",").map(e => e.userTrim().replace(/_|\s/g, "-")).filter(e => e && e !== faq.id))
              return Array.from(item)
            },
            validation(item) {
              if (item) {
                if (item.length > 10) return "Too many aliases. The maximum number of aliases is `10`"
                for (const alias of item) {
                  if (alias.length > 32) return "An alias was too long. The maximum alias length is `32` characters"
                  if (db.faq.alias(faq.category, faq.id, alias)) return `The alias ${alias.quote()} is already in use in another FAQ, please pick a different alias`
                }
              }
            },
            component: component.input({
              id: "aliases",
              placeholder: "Alternative FAQ IDs (comma separated)"
            })
          }
        ]
      },
      onSubmit(fields) {
        if (defined(fields.embed)) faq.data.embedless = fields.embed === false ? true : undefined
        if (fields.image) faq.data.image = fields.image
        if (fields.aliases?.length) faq.data.aliases = fields.aliases
        return true
      }
    })
    if (modal2.timeout) return
    modalMessage = modal2.message
    db.faq.set(faq.category, faq.id, faq.text, faq.data)
    if (faq.data.embedless) {
      sendComponents(message, {
        title: `FAQ ${existing ? "updated" : "added"}`,
        description: "Here is a preview of the FAQ:"
      }, modalMessage)
      return sendMessage(message.channel, {
        content: makeFAQ(faq).content
      })
    }
    sendComponents(message, {
      components: [
        component.container(message, [`## FAQ ${existing ? "updated" : "added"}\nHere is a preview of the FAQ:`]),
        component.container(message, [
          `## ${faq.category.toTitleCase(true, true)}: ${faq.id.toTitleCase(true, true)}\n${faq.text}`,
          faq.data.image ? component.media(faq.data.image) : undefined
        ].filter(Boolean))
      ]
    }, modalMessage)
  }
})