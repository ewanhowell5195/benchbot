registerFunction(scriptName, async (message, data) => {
  const file = await makeFile(data)
  if (!file?.attachment?.length) return sendError(message, {
    title: "Unable to save file",
    description: "An error occurred while trying to save that file",
    processing: data.processing
  })
  if (file.attachment.length > 26214400) return sendError(message, {
    title: "Unable to upload file",
    description: "The command completed successfully, but the resulting file was over the `25 MB` upload limit",
    processing: data.processing
  })
  return sendMessage(message, {
    embedless: true,
    files: [file],
    processing: data.processing
  })
})