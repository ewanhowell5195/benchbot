registerFunction(scriptName, {
  makeModal(args) {
    const modal = new Discord.ModalBuilder({
      customId: args.id || Math.random().toString(),
      title: args.title
    })
    for (const row of args.rows) {
      if (typeof row === "string") {
        modal.addTextDisplayComponents(component.text(row))
      } else {
        modal.addComponents(component.label({
          label: row.label,
          description: row.description,
          component: row.component
        }))
      }
    }
    return modal
  }
})