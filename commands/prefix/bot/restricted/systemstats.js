const os = require("node:os")

function getCPUUsage() {
  const start = getCPUInfo()
  return new Promise(fulfil => setTimeout(() => {
    const end = getCPUInfo()
    fulfil(1 - (end.idle - start.idle) / (end.total - start.total))
  }, 1000))
}

function getCPUInfo() {
  let total = 0
  let idle = 0
  const cpus = os.cpus()
  for (const cpu of cpus) {
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq
    idle += cpu.times.idle
  }
  return { idle, total: total + idle }
}

const getStorage = async () => {
  const command = process.platform === "win32" ? ["wmic", "logicaldisk", "where", `DeviceID='C:'`, "get", "Size,FreeSpace", "/format:value"] : ["df", "-k", "/"]
  const p = spawn(command[0], command.slice(1), { stdio: ["ignore", "pipe", "inherit"] })
  let out = ""
  for await (const chunk of p.stdout) out += chunk
  if (process.platform === "win32") {
    const total = parseInt(out.match(/Size=(\d+)/)[1])
    const free = parseInt(out.match(/FreeSpace=(\d+)/)[1])
    return {
      used: total - free,
      free,
      total
    }
  } else {
    const diskInfo = out.split("\n")[1].split(/\s+/)
    return {
      used: parseInt(diskInfo[2]) * 1024,
      free: parseInt(diskInfo[3]) * 1024,
      total: parseInt(diskInfo[1]) * 1024
    }
  }
}

registerPrefixCommand(scriptName, prefixPath, {
  description: "View the stats about the system the bot is running on.",
  aliases: ["systemspecs", "specs"],
  permissions: ["BotOwner"],
  async execute(message, args) {
    const storage = await getStorage()
    const stats = await sendMessage(message, {
      author: ["Measuring...", client.icons.pinging]
    })
    const totalMem = (os.totalmem() / 1073741824).toFixed(2)
    const usedMem = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(2)
    editMessage(stats, {
      author: ["System stats", client.icons.stats],
      fields: [
        ["Platform", `\`${process.platform} ${os.release()}\``],
        ["Uptime", `\`${durationString(os.uptime()*1000)}\``],
        ["CPU", `\`${os.cpus()[0].model}\``, true],
        ["CPU Usage", `\`${formatPercentage(((await getCPUUsage()) * 100).toFixed(2))}\``, true],
        ["​", "​", true],
        ["Total Memory", `\`${totalMem} GB\``, true],
        ["Memory Usage", `\`${usedMem} GB (${percentage(usedMem, totalMem)})\``, true],
        ["​", "​", true],
        ["Total Storage", `\`${formatBytes(storage.total)}\``, true],
        ["Used Storage", `\`${formatBytes(storage.used)} (${percentage(storage.used, storage.total)})\``, true],
        ["Free Storage", `\`${formatBytes(storage.free)} (${percentage(storage.free, storage.total)})\``, true],
        ["Node.js Version", process.version.quote()]
      ]
    }).catch(() => {})
  }
})