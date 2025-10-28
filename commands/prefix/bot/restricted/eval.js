const { Console } = require("console")
const { Duplex } = require("stream")

class ConsoleOutput extends Duplex {
  constructor(...args) {
    super(...args)
    this.output = ""
  }

  _write(e) {
    this.output += e
  }

  _read() {
    return this.output
  }
}

registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Evaluate some code and view the output.",
    arguments: "[code]"
  },
  aliases: ["evaluate"],
  arguments: ["*code"],
  permissions: ["BotOwner"],
  async execute(message, args) {
    const m = args[0].match(/(?<=```(?:js|javascript)?\n)[\s\S]*(?=```)/gm)
    if (m) args[0] = m[0]
    const guild = message.guild
    const channel = message.channel
    const member = message.member
    const user = message.author
    const evalOut = new ConsoleOutput()
    evalOut.setEncoding("utf8")
    const console3 = new Console({
      stdout: evalOut
    })
    let out = ""
    try {
      const console = {
        log(...args) {
          for (const [i, arg] of args.entries()) {
            const evalOut2 = new ConsoleOutput()
            const console2 = new Console({
              stdout: evalOut2
            })
            console2.log(arg)
            if (i > 0) {
              out = out.slice(0, -1) + " " + evalOut2._read()
            } else {
              out += evalOut2._read()
            }
          }
        }
      }
      console3.log(await eval(`(async () => {try {return await (async () => {${args[0].includes("return") || args[0].includes("console.log") ? args[0] : "return " + args[0]}})()} catch(err) {return err}})()`))
      if (args[0].includes("return") || !args[0].includes("console.log")) out += evalOut._read()
      for (const [type, token] of Object.entries(tokens)) {
        if (typeof token === "object") for (const [subType, subToken] of Object.entries(token)) out = out.replace(new RegExp(escapeStringRegexp(subToken), "g"), `${subType.toUpperCase()}_TOKEN_REDACTED`)
        else out = out.replace(new RegExp(escapeStringRegexp(token), "g"), `${type.toUpperCase()}_TOKEN_REDACTED`)
      }
      out = out.trim()
      if (out.length > 4086) return sendFile(message, {
        name: "eval.js",
        buffer: Buffer.from(out, "utf8")
      })
      if (out === "null") return
      if (out === "") {
        return sendMessage(message, {
          description: "The command returned no output"
        })
      }
      sendMessage(message, {
        description: `\`\`\`js\n${out}\n\`\`\``
      })
    } catch(err) {
      sendError(message, {
        description: `\`\`\`js\n${limit(err.message, 4086)}\`\`\``
      })
    }
  }
})