registerFunction(scriptName, {
  hasFlag: {
    message: (item, flag) => item.flags.has(Discord.MessageFlags[flag])
  },
  getFlag: {
    message: flag => Discord.MessageFlags[flag]
  }
})