registerFunction(scriptName, {
  isType: {
    channel(channel, type) {
      channel = channel?.type ?? channel
      if (type === "Thread") return (channel === Discord.ChannelType.PublicThread) || (channel === Discord.ChannelType.PrivateThread)
      if (type === "Voice") return (channel === Discord.ChannelType.GuildVoice) || (channel === Discord.ChannelType.GuildStageVoice)
      return channel === Discord.ChannelType[type]
    },
    interaction: (interaction, type) => (interaction?.type ?? interaction) === Discord.InteractionType[type],
    option: (option, type) => (option?.type ?? option) === Discord.ApplicationCommandOptionType[type],
    sticker: (sticker, type) => (sticker?.format ?? sticker) === Discord.StickerFormatType[type],
    command: (command, type) => (command?.commandType ?? command) === Discord.ApplicationCommandType[type],
    error: (err, type) => (err?.code ?? err) === Discord.RESTJSONErrorCodes[type]
  },
  getType: {
    channel: channel => Discord.ChannelType[channel?.type ?? channel],
    verificationLevel: guild => Discord.GuildVerificationLevel[guild?.verificationLevel ?? guild],
    premiumTier: guild => Discord.GuildPremiumTier[guild?.premiumTier ?? guild],
    activity: activity => Discord.ActivityType[activity?.type ?? activity],
    image: image => Discord.ImageFormat[image?.type ?? image],
    permission: permission => Discord.PermissionsBitField.Flags[permission],
    commandPermission: permission => Discord.ApplicationCommandPermissionType[permission?.type ?? permission],
    ruleEvent: event => Discord.AutoModerationRuleEventType[event],
    ruleTrigger: trigger => Discord.AutoModerationRuleTriggerType[trigger],
    action: action => Discord.AutoModerationActionType[action]
  }
})