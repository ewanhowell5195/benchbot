registerSlashCommand(scriptName, slashPath, {
  arguments: [
    {
      name: "title",
      description: "The model's title",
      maxLength: 50,
      minLength: 6,
      required: true
    },
    {
      type: "attachment",
      name: "image",
      description: "The model's 1st image",
      required: true
    },
    {
      name: "description",
      description: "The model's description",
      maxLength: 256
    },
    {
      type: "attachment",
      name: "image2",
      description: "The model's 2nd image"
    },
    {
      type: "attachment",
      name: "image3",
      description: "The model's 3rd image"
    },
    {
      type: "attachment",
      name: "image4",
      description: "The model's 4th image"
    }
  ],
  execute(interaction, title, image, description, image2, image3, image4) {
    interaction.attachments = new Discord.Collection()
    for (const attachment of [image, image2, image3, image4].filter(Boolean)) interaction.attachments.set(attachment.id, attachment)
    return interaction.command.prefixCommand.execute(interaction, title, description)
  }
})
