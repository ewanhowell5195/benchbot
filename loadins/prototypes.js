registerLoadIn(scriptName, {
  load() {
    String.prototype.toTitleCase = toTitleCase
    String.prototype.quote = function(c, lang = "") {
      if (c) return `\`\`\`${lang}
${this.replaceAll("`", "´")}\`\`\``
      return `\`${this.replaceAll("`", "´")}\``
    }
    Number.prototype.quote = function(c, lang = "") {
      if (c) return `\`\`\`${lang}
${this.toLocaleString()}\`\`\``
      return `\`${this.toLocaleString()}\``
    }
  },
  unload() {
    delete String.prototype.toTitleCase
    delete String.prototype.quote
    delete Number.prototype.quote
  }
})