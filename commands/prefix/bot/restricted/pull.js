registerPrefixCommand(scriptName, prefixPath, {
  description: "Pull the latest changes from GitHub.",
  permissions: ["BotOwner"],
  async execute(message, args) {
    const p = spawn("git", ["pull"], { stdio: ["ignore", "pipe", "ignore"] })
    let out = ""
    for await (const chunk of p.stdout) out += chunk
    out = out.trim()
    if (out.length > 4086) return sendFile(message, {
      name: "pull.txt",
      buffer: Buffer.from(out, "utf8")
    })
    sendMessage(message, {
      description: `\`\`\`diff\n${out}\`\`\``
    })
  }
})