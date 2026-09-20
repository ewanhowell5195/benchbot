registerFunction(scriptName, async (member, reason) => {
  if (!reason) {
    reason = "Compromised account"
  } else if (reason.length < 490) {
    reason += " - Compromised account"
  }
  await sendMessage(member, {
    author: ["Account security alert", client.icons.warningYellow],
    title: "Potential compromise detected!",
    description: `You were removed from the server ${member.guild.name.quote()} because your account appears to be compromised. Please update your password immediately and review your connected applications for any suspicious activity.`,
    colour: client.colours.warning
  }).catch(() => {})
  await member.guild.bans.create(member.user, {
    deleteMessageSeconds: 28800,
    reason
  })
  await member.guild.bans.remove(member.user, {
    reason: "Unbanned as part of compromised account kick process"
  })
})
