const {StyleModule} = require("..")
const ist = require("ist")

describe("StyleModule", () => {
  it("renders objects to CSS text", () => {
    ist(rules(new StyleModule({main: {color: "red", border: "1px solid green"}})),
        [".c1 {color: red; border: 1px solid green}"], eqRules)
  })

  it("assigns different class to different objects", () => {
    ist(rules(new StyleModule({
      one: {color: "green"},
      two: {color: "blue"}
    })), [
      ".c1 {color: green}",
      ".c2 {color: blue}"
    ], eqRules)
  })

  it("supports pseudo-selectors", () => {
    ist(rules(new StyleModule({
      main: {
        color: "yellow",
        "&:hover": {fontWeight: "bold"}
      }
    })), [
      ".c1:hover {font-weight: bold}",
      ".c1 {color: yellow}"
    ], eqRules)
  })

  it("supports media queries", () => {
    ist(rules(new StyleModule({
      main: {
        "@media screen and (min-width: 400px)": {
          fontFamily: '"URW Bookman"',
          MozBoxSizing: "border-box"
        }
      }
    })), ["@media screen and (min-width: 400px) {.c1 {font-family: \"URW Bookman\"; -moz-box-sizing: border-box}}"], eqRules)
  })

  it("can render multiple instances of a property", () => {
    ist(rules(new StyleModule({
      main: {
        color: "rgba(100, 100, 100, .5)",
        color_2: "grey"
      }
    })), [".c1 {color: rgba(100, 100, 100, .5); color: grey}"], eqRules)
  })

  it("can add specificity", () => {
    let mod = new StyleModule({
      main: {
        specificity: 1,
        color: "yellow"
      },
      other: {
        specificity: 2,
        color: "blue"
      }
    })
    ist(rules(mod), [".c1.c_ {color: yellow}", ".c2.c_.c_1 {color: blue}"], eqRules)
    ist(mod.main.split(" ").length, 2)
    ist(mod.other.split(" ").length, 3)
  })
})

function rules(module) {
  for (let p in module) if (Array.isArray(module[p])) return module[p]
  for (let p of Object.getOwnPropertySymbols(module)) if (Array.isArray(module[p])) return module[p]
}

function norm(rules) {
  let names = [], re = /\.[c\u037c](\w+)/g, m
  for (let rule of rules) while (m = re.exec(rule)) if (names.indexOf(m[1]) < 0) names.push(m[1])
  return rules.map(rule => rule.replace(re, (_, id) => ".c" + (names.indexOf(id) + 1)))
}

function eqRules(a, b) {
  return JSON.stringify(norm(a)) == JSON.stringify(norm(b))
}
