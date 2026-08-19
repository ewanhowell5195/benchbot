registerEvent(scriptName, async () => {
  console.log(`${client.user.displayName} ready`)
  setActivity()
  if (fs.existsSync("./restart.json")) {
    const data = JSON.parse(fs.readFileSync("./restart.json", "utf8"))
    const channel = await getChannel(data[0])
    if (channel) await sendMessage(channel, {
      author: ["Restarted sucessfully"],
      processing: await getMessage(channel, data[1])
    })
    fs.unlinkSync("./restart.json")
  }
})