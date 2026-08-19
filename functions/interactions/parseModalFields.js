registerFunction(scriptName, async (interaction, modal, fields) => {
  const errorFields = []
  const modal2 = {
    title: modal.title,
    rows: []
  }
  let required
  for (const row of modal.rows) {
    if (typeof row === "string") continue
    let error
    let text
    if (row.component) {
      const id = row.component.data.custom_id
      if (row.component instanceof Discord.TextInputBuilder) {
        text = {
          id,
          label: row.label,
          required: row.component.data.required !== false,
          type: row.type,
          func: row.func,
          validation: row.validation,
          invalidChars: row.invalidChars,
          min: row.min,
          max: row.max,
          default: row.default
        }
      } else if (row.component instanceof Discord.CheckboxBuilder) {
        fields[id] = interaction.fields.getCheckbox(id)
      } else if (row.component instanceof Discord.RadioGroupBuilder) {
        const value = interaction.fields.getRadioGroup(id)
        if (defined(value)) fields[id] = value
        else if (defined(row.default)) fields[id] = row.default
      } else if (row.component instanceof Discord.StringSelectMenuBuilder) {
        const values = interaction.fields.getStringSelectValues(id)
        if (values?.length) {
          if ((row.component.data.max_values ?? 1) === 1) {
            fields[id] = values[0]
          } else {
            fields[id] = values
          }
        }
      } else if (row.component instanceof Discord.ChannelSelectMenuBuilder) {
        const channels = interaction.fields.getSelectedChannels(id)
        if (channels) {
          if (row.component.data.max_values === 1) {
            fields[id] = channels.first()
          } else {
            fields[id] = channels
          }
        }
      } else if (row.component instanceof Discord.RoleSelectMenuBuilder) {
        const roles = interaction.fields.getSelectedRoles(id)
        if (roles) {
          if (row.component.data.max_values === 1) {
            fields[id] = roles.first()
          } else {
            fields[id] = roles
          }
        }
      }
      if (!text) {
        if (!error && row.func) fields[id] = await row.func(fields[id], fields)
        if (!error && row.validation) {
          const validation = await row.validation(fields[id], fields)
          if (validation) {
            error = true
            if (validation.required) required = true
            if (validation.fields) modal2.rows.push(...validation.fields)
            errorFields.push([`Validation failed for ${row.label.quote()}`, validation.message ?? validation])
          }
        }
        if (error) {
          modal2.rows.push(row)
          if (row.component.data.required != false) {
            required = true
          }
          fields[id] = undefined
        }
        continue
      }
    } else continue
    const value = interaction.fields.getTextInputValue(text.id).userTrim()
    if (value) {
      fields[text.id] = interaction.fields.getTextInputValue(text.id) || undefined
      if (fields[text.id]) {
        if (text.type) {
          if (text.type === "url") {
            const url = await argTypes.url(fields[text.id])
            if (!url) {
              error = true
              errorFields.push([`Invalid URL for ${text.label.quote()}`, `The URL ${fields[text.id].quote()} was not a valid URL`])
            } else fields[text.id] = url
          } else if (text.type === "number") {
            const number = await argTypes.number(fields[text.id], { errorless: true })
            if (number === undefined) {
              error = true
              errorFields.push([`Invalid number for ${text.label.quote()}`, `${fields[text.id].quote()} is not a valid number`])
            } else if (text.min && text.min > number) {
              error = true
              errorFields.push([`Value too small for ${text.label.quote()}`, `The minimum value is ${text.min.quote()}. You provided ${fields[text.id].quote()}`])
            } else if (text.max && text.max < number) {
              error = true
              errorFields.push([`Value too large for ${text.label.quote()}`, `The maximum value is ${text.max.quote()}. You provided ${fields[text.id].quote()}`])
            } else {
              fields[text.id] = number
            }
          } else if (text.type === "boolean") {
            const boolean = await argTypes.boolean(fields[text.id])
            if (boolean === undefined) {
              error = true
              errorFields.push([`Invalid boolean for ${text.label.quote()}`, `${fields[text.id].quote()} is not a valid boolean\n\nPlease provide \`yes\` or \`no\``])
            } else fields[text.id] = boolean
          }
        }
        if (text.invalidChars) {
          const match = fields[text.id].match(text.invalidChars)
          if (match) {
            error = true
            errorFields.push([`Unsupported character in ${text.label.quote()}`, `You cannot use the \`${match[0] === "\n" ? "newline" : match[0] === " " ? "space" : match[0]}​\` character`])
          }
        }
        if (text.func) fields[text.id] = await text.func(fields[text.id], fields)
      }
    } else if (text.required) {
      error = true
      errorFields.push(["Missing required field", `${text.label.quote()} is a required field`])
    } else if (defined(text.default)) {
      fields[text.id] = text.default
    } else {
      fields[text.id] = undefined
    }
    if (!error && text.validation) {
      const validation = await text.validation(fields[text.id], fields)
      if (validation) {
        error = true
        if (validation.required) required = true
        if (validation.fields) modal2.rows.push(...validation.fields)
        errorFields.push([`Validation failed for ${text.label.quote()}`, validation.message ?? validation])
      }
    }
    if (error) {
      modal2.rows.push(row)
      required = required || text.required
      fields[text.id] = undefined
    }
  }
  return [modal2, errorFields, required]
})