registerPrefixCommand(scriptName, prefixPath, {
  help: {
    description: "Send the job channels overview message."
  },
  permissions: ["BotOwner"],
  async execute(message) {
    sendMessage(message.channel, {
      content: `# Job Channels

Welcome to the Job Channels - a space to connect artists with people looking for creative work, whether it's paid or collaborative.

## Artist List
If you're an artist and want to showcase your skills:
- Post to the Artist List channel to introduce yourself.
- Include what kind of work you do, your portfolio, and your rates.
- Potential clients can browse this list and reach out to you directly.

## Job List
If you're looking to hire artists for a paid project:
- Post to the Job List channel with all the details.
- Explain what you need, the type of artist you're looking for, and the pay or budget range.
- Artists can then contact you if they're interested.

## Project List
If you're starting a collaborative or freelance project:
- Post to the Project List channel to find other creators to work with.
- This is ideal for non-paid or passion projects where you're seeking like-minded collaborators.

## DISCLAIMER
The Job Channels act purely as bulletin boards and are not moderated or verified by the server team.  
Please:
- Be cautious when communicating with others.
- Watch out for scams.
- Handle agreements, payments, and disputes responsibly.

Use the button below to gain access to the Job Channels.
      `,
      components: [
        component.row(
          component.button({
            id: "jobs_access_button",
            label: "Get Job Channel Access",
            style: "blue"
          })
        )
      ]
    })
  }
})