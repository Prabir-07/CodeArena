function pickFields(source, fields) {
  const result = {};

  for (const field of fields) {
    if (field in source) {
      result[field] = source[field];
    }
  }

  return result;
}

module.exports = pickFields;
