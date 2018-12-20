const StyleModule = require("../dist/style-module")
const ist = require("ist")

function content(rule) {
  return /{(.*)}$/.exec(rule)[1]
}

describe("StyleModule", () => {
  it("renders objects to CSS text", () => {
    let m = new StyleModule({color: "red", border: "1px solid green"})
    ist(m.rules.length, 1)
    ist(content(m.rules[0]), "color: red; border: 1px solid green;")
  })
})
