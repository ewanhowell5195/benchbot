registerFunction(scriptName, async (message, modalMessage, modal, func, args, func2) => {
  let finished
  const fields = args.fields ?? {}
  if (modalMessage) {
    await interactionHandler(modalMessage, async (interaction, collector, state) => {
      if (args?.authorOnly && interaction.user.id !== message.author.id) return sendPrivateMessage(interaction, { description: "Only the command author can do that" })
      if (isType.interaction(interaction, "ModalSubmit")) {
        if (args.defer !== false) interaction.deferUpdate()
        const [modal2, errorFields, required] = await parseModalFields(interaction, modal, fields, args)
        if (errorFields.length) {
          let buttons = [{
            label: "Re-enter data",
            emoji: client.emotes.pencilWhite,
            customId: "modal"
          }]
          if (!required) buttons.push({
            label: "Skip",
            customId: "skip",
            emoji: client.emotes.arrowRightWhite
          })
          if (args.errorButtons) buttons = buttons.concat(args.errorButtons.filter(e => !(e.disableSkip && required)))
          modal = modal2
          return await sendMessage(args.interaction ?? message, {
            title: "There were some issues with that input",
            fields: errorFields,
            components: [makeRow({
              buttons
            })],
            processing: args.interaction ? undefined : modalMessage
          })
        }
        finished = await func(fields, interaction, null, modalMessage)
        if (finished) {
          state.timeout = false
          if (finished === 2) finished = false
          collector.stop()
        }
        return
      }
      if (interaction.customId === "modal") interaction.showModal(makeModal(modal))
      else if (interaction.customId === "skip") {
        if (args.defer !== false) interaction.deferUpdate()
        finished = await func(fields, interaction, true)
        if (finished) {
          state.timeout = false
          if (finished === 2) finished = false
          collector.stop()
        }
      }
      else {
        finished = await func2?.(interaction, {func, fields})
        if (finished) {
          state.timeout = false
          if (finished === 2) finished = false
          collector.stop()
        }
        return
      }
    }, {
      timeout: args.timeout ?? 300,
      timeoutMessage: "The command timed out...",
      leave: args.leave
    })
  } else {
    message.showModal(makeModal(modal))
    const interaction = await message.awaitModalSubmit({
      time: 300000
    }).catch(e => {
      if (e.message !== "Collector received no interactions before ending with reason: time") console.error(e)
      return
    })
    if (!interaction) {
      sendError(message, {
        message: "Took too long",
        description: `${message.author} took too long, the modal timed out.`
      })
      return
    }
    const [modal2, errorFields, required] = await parseModalFields(interaction, modal, fields, args)
    if (errorFields.length) {
      let buttons = [{
        label: "Re-enter data",
        emoji: client.emotes.pencilWhite,
        customId: "modal"
      }]
      if (!required) buttons.push({
        label: "Skip",
        customId: "skip",
        emoji: client.emotes.arrowRightWhite
      })
      if (args.errorButtons) buttons = buttons.concat(args.errorButtons.filter(e => !(e.disableSkip && required)))
      const modalMessage = await sendMessage(interaction, {
        title: "There were some issues with that input",
        fields: errorFields,
        components: [makeRow({
          buttons
        })],
        fetch: true
      })
      args.interaction = interaction
      args.fields = fields
      if (!(await modalHandler(message, modalMessage, modal2, func, args, func2))) return
      finished = true
    } else {
      finished = await func(fields, interaction, null, interaction)
      if (finished === 2) finished = false
    }
  }
  return finished
})