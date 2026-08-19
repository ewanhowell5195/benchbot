registerFunction(scriptName, async (message, modalMessage, { prompt, modal, onSubmit, onTimeout, onInteraction, authorOnly = true, timeout = 300, errorButtons, defer = true }) => {
  let state = {}
  const fields = {}
  const makeErrorButtons = required => {
    const buttons = [
      component.button({
        id: "modal",
        label: "Re-enter data",
        emoji: client.emotes.pencilWhite
      })
    ]
    if (!required) {
      buttons.push(component.button({
        id: "skip",
        label: "Skip",
        emoji: client.emotes.arrowRightWhite
      }))
    }
    if (errorButtons) {
      buttons.push(...errorButtons.map(e => component.button(e)))
    }
    return buttons
  }
  const makeErrorComponents = (errors, required) => [
    component.text("## There were some issues with that input"),
    component.separator(),
    ...errors.map(e => component.text(`### ${e[0]}\n${e[1]}`)),
    component.separator(),
    component.row(...makeErrorButtons(required))
  ]
  if (prompt) {
    if (!modalMessage && message instanceof Discord.BaseInteraction && typeof message.showModal === "function" && !message.replied && !message.deferred) {
      modal.id ??= Math.random().toString()
      const author = message.author ?? message.user
      message.showModal(makeModal(modal))
      const submit = await message.awaitModalSubmit({
        time: timeout * 1000,
        filter: e => e.customId === modal.id && e.user.id === author.id
      }).catch(() => {})
      if (!submit) {
        state.timeout = true
        if (onTimeout) await onTimeout(state)
        state.fields = fields
        return state
      }
      const [modal2, errors, required] = await parseModalFields(submit, modal, fields)
      if (!errors.length) {
        state.timeout = false
        state.interaction = submit
        state.messages = []
        if (onSubmit) await onSubmit(fields, submit, { state })
        state.fields = fields
        return state
      }
      modal = modal2
      await sendComponents(submit, makeErrorComponents(errors, required))
      modalMessage = submit.message
    } else {
      modalMessage = await sendComponents(message, prompt, modalMessage)
    }
  }
  state = await interactionHandler(modalMessage, async (interaction, collector, s) => {
    state = s
    if (isType.interaction(interaction, "ModalSubmit")) {
      if (defer) interaction.deferUpdate()
      const [modal2, errors, required] = await parseModalFields(interaction, modal, fields)
      if (errors.length) {
        modal = modal2
        state.message = await sendComponents(message, makeErrorComponents(errors, required), state.message)
        return
      }
      if (!onSubmit || await onSubmit(fields, interaction, { state })) {
        state.timeout = false
        collector.stop()
      }
      return
    }

    if (interaction.customId === "modal") {
      interaction.showModal(makeModal(modal))
    } else if (interaction.customId === "skip") {
      if (defer) interaction.deferUpdate()
      if (!onSubmit || await onSubmit(fields, interaction, { state, skipped: true })) {
        state.timeout = false
        collector.stop()
      }
    } else if (onInteraction) {
      if (await onInteraction(interaction, { state, fields, onSubmit })) {
        state.timeout = false
        collector.stop()
      }
      if (defer && !interaction.replied && !interaction.deferred) {
        interaction.deferUpdate().catch(() => {})
      }
    }
  }, {
    timeout,
    author: authorOnly ? message.author ?? message.user : undefined,
    timeoutMessage: onTimeout ? undefined : {
      title: "Timed out…",
      description: "The command timed out as you took too long to respond"
    }
  })

  if (onTimeout && state.timeout) {
    await onTimeout(state)
  }

  state.fields = fields
  return state
})