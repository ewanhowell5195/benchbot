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
    String.prototype.userTrim = function() {
      return this.replace(/^[\s\u200B\u3164\u00A0\u180E\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]*|[\s\u200B\u3164\u00A0\u180E\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]*$/g, "")
    }
  },
  unload() {
    delete String.prototype.toTitleCase
    delete String.prototype.quote
    delete Number.prototype.quote
    delete String.prototype.userTrim
  }
})