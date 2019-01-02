const {StyleModule} = require("../dist/style-module")
const ist = require("ist")

describe("StyleModule", () => {
  it("renders objects to CSS text", () => {
    let m = new StyleModule({main: {color: "red", border: "1px solid green"}})
    ist(m.rules.length, 1)
    ist(m.rules[0], ".%main% {color: red; border: 1px solid green}")
  })

  it("assigns different class to different objects", () => {
    let m = new StyleModule({
      one: {color: "green"},
      two: {color: "blue"}
    })
    ist(m.rules.length, 2)
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
    ist(m.rules[0], ".%main%:hover {font-weight: bold}")
    ist(m.rules[1], ".%main% {color: yellow}")
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
    ist(m.rules[0], "@media screen and (min-width: 400px) {.%main% " +
        "{font-family: \"URW Bookman\"; -moz-box-sizing: border-box}}")
  })

  it("collapses empty styles", () => {
    let m = new StyleModule({foo: {}})
    ist(m.rules.length, 0)
  })

  it("doesn't collapse exported names", () => {
    let m = new StyleModule({foo: {export: true}})
    ist(m.rules.length, 1)
  })

  it("can create nested selectors", () => {
    let m = new StyleModule({foo: {export: true}})
    let n = new StyleModule({
      bar: {"parent(foo)": {parentModule: m, color: "yellow"}}
    })
    ist(n.rules.length, 1)
    ist(n.rules[0], ".%0/foo% .%bar% {color: yellow}")
  })
})
