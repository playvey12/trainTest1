function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
const empty = "— ";

module.exports = { isEmpty, empty };
