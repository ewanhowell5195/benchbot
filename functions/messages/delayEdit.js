registerFunction(scriptName, async (message, content) => {
  // Discord discards an embed edit made within ~250ms of the message being created (discord/discord-api-docs#7980)
  if (!message?.createdTimestamp) return
  if (!content?.embeds?.length && !message.embeds?.length) return
  const age = Date.now() - message.createdTimestamp
  if (age < 250) await new Promise(fulfil => setTimeout(fulfil, 250 - age))
})
