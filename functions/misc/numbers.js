registerFunction(scriptName, {
  plural: count => count === 1 ? "" : "s",
  randInt: max => Math.floor(Math.random() * (max + 1)),
  durationString(num) {
    if (!num) return num
    const years = Math.floor(num / 3.1536e10)
    let days = Math.floor(num / 8.64e7) % 365
    const weeks = Math.floor(days / 7)
    days %= 7
    const hours = Math.floor(num / 3.6e6) % 24
    const minutes = Math.floor(num / 6e4) % 60
    const seconds = Math.round(num / 1000 % 60)
    return `${years} year${years === 1 ? "" : "s"}, ${weeks} week${weeks === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"}, ${hours.toString().padStart(2, 0)}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`.replace(/(?<!\d)0\s[a-z]+,\s/g, "").replace(/(, 00:00:00)/, "")
  },
  formatPercentage: percentage => percentage.toString().replace(/\.?0+$/, "") + "%",
  percentage: (val, total) => formatPercentage(((val / total) * 100).toFixed(2))
})