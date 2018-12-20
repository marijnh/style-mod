const StyleModule = require("../dist/style-module")
const ist = require("ist")

describe("StyleModule", () => {
  it("renders objects to CSS text", () => {
    let m = new StyleModule({main: {color: "red", border: "1px solid green"}})
    ist(m.rules.length, 1)
    ist(m.rules[0], "." + m.classes.main + " {color: red; border: 1px solid green}")
  })

  it("assigns different classes to different objects", () => {
    let m = new StyleModule({
      one: {color: "green"},
      two: {color: "blue"}
    })
    ist(m.rules.length, 2)
    ist(m.classes.one, m.classes.two, "!=")
    ist(/green/.test(m.rules[0]))
    ist(/blue/.test(m.rules[1]))
  })

  it("supports pseudo-selectors", () => {
    let m = new StyleModule({
      main: {
        color: "yellow",
        ":hover": {fontWeight: "bold"}
      }
    })
    ist(m.rules[0], "." + m.classes.main + ":hover {font-weight: bold}")
    ist(m.rules[1], "." + m.classes.main + " {color: yellow}")
  })

  it("supports media queries", () => {
    let m = new StyleModule({
      main: {
        "@media screen and (min-width: 400px)": {
          fontFamily: '"URW Bookman"',
          MozBoxSizing: "border-box"
        }
      }
    })
    ist(m.rules.length, 1)
    ist(m.rules[0], "@media screen and (min-width: 400px) {." + m.classes.main +
        " {font-family: \"URW Bookman\"; -moz-box-sizing: border-box}}")
  })

  it("can extend a module", () => {
    let m1 = new StyleModule({
      one: {color: "blue"},
      two: {textAlign: "center"}
    })
    let m2 = m1.extend({
      two: {border: "none"},
      three: {pointerEvents: "none"}
    })
    ist(m2.classes.one, m1.classes.one)
    ist(m2.classes.two.indexOf(m1.classes.two), -1, ">")
    ist(m2.classes.three)
  })
})
