registerLoadIn(scriptName, {
  load() {
    client.icons = Object.fromEntries([
      "discord",
      "error",
      "faq",
      "help",
      "logs",
      "medalGreen",
      "optifine",
      "ping",
      "warningRed"
    ].map(e => [e, `https://wynem.com/assets/images/icons/${e.replace(/[A-Z]/g, "_$&").toLowerCase()}.webp`]))
    client.icons.pinging = "https://wynem.com/assets/images/icons/pinging.gif"
  },
  unload: () => delete client.icons
})