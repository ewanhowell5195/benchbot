database.prepare(`
  CREATE TABLE IF NOT EXISTS faqs (
    category TEXT NOT NULL,
    id TEXT NOT NULL,
    text TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (category, id)
  )
`).run()

export default {
  get: prepareDBAction(`
    SELECT text, data
    FROM faqs
    WHERE category = ? AND id = ?
  `, "get", null, o => {
    if (o) o.data = JSON.parse(o.data)
    return o
  }),
  set: prepareDBAction(`
    INSERT OR REPLACE INTO faqs (category, id, text, data)
    VALUES (?, ?, ?, ?)
  `, "run", (c, i, t, d) => [c, i, t, JSON.stringify(d)]),
  all: prepareDBAction(`
    SELECT *
    FROM faqs
  `, "all", null, o => {
    o.forEach(e => e.data = JSON.parse(e.data))
    return o
  }),
  remove: prepareDBAction(`
    DELETE FROM faqs
    WHERE category = ? AND id = ?
  `),
  rename: prepareDBAction(`
    UPDATE faqs
    SET category = ?, id = ?
    WHERE category = ? AND id = ?
  `),
  categories: prepareDBAction(`
    SELECT DISTINCT category
    FROM faqs
  `, "all", null, o => o.map(e => e.category)),
  ids: prepareDBAction(`
    SELECT id
    FROM faqs
    WHERE category = ?
  `, "all", null, o => o.map(e => e.id)),
  alias: prepareDBAction(`
    SELECT 1
    FROM faqs
    WHERE category = ? AND id != ? AND (
      EXISTS (
        SELECT 1
        FROM json_each(json_extract(faqs.data, '$.aliases')) AS alias
        WHERE alias.value = ?
      )
    )
  `, "get", (c, i, a) => [c, i, a, a], o => !!o)
}