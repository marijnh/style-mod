const {StyleModule} = require("../dist/stylemodule")
const ist = require("ist")

describe("StyleModule", () => {
  it("renders objects to CSS text", () => {
    ist(rules(new StyleModule({main: {color: "red", border: "1px solid green"}})),
        [".c1 {color: red; border: 1px solid green}"], eqJSON)
  })

  it("assigns different class to different objects", () => {
    ist(rules(new StyleModule({
      one: {color: "green"},
      two: {color: "blue"}
    })), [
      ".c1 {color: green}",
      ".c2 {color: blue}"
    ], eqJSON)
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
    ], eqJSON)
  })

  it("supports media queries", () => {
    ist(rules(new StyleModule({
      main: {
        "@media screen and (min-width: 400px)": {
          fontFamily: '"URW Bookman"',
          MozBoxSizing: "border-box"
        }
      }
    })), ["@media screen and (min-width: 400px) {.c1 {font-family: \"URW Bookman\"; -moz-box-sizing: border-box}}"], eqJSON)
  })

  it("puts modules in the right order", () => {
    let d = mockDoc()
    new StyleModule({main: {color: "blue"}}).mount(d, StyleModule.highPriority)
    new StyleModule({main: {color: "red"}}).mount(d, StyleModule.lowPriority)
    new StyleModule({main: {color: "white"}}).mount(d)
    ist(d.text.replace(/\u037c/g, "c").split("\n"), [
      ".c2 {color: red}",
      ".c3 {color: white}",
      ".c1 {color: blue}"
    ], eqJSON)
  })

  it("can render multiple instances of a property", () => {
    ist(rules(new StyleModule({
      main: {
        color: "rgba(100, 100, 100, .5)",
        color_2: "grey"
      }
    })), [".c1 {color: rgba(100, 100, 100, .5); color: grey}"], eqJSON)
  })
})

function mockDoc() {
  return {
    insertBefore(tag) { this.tag = tag },
    createElement() { return {textContent: ""} },
    get text() { return this.tag.textContent }
  }
}

function rules(module) {
  let doc = mockDoc()
  module.mount(doc)
  return doc.text.replace(/\u037c/g, "c").split("\n")
}

function eqJSON(a, b) { return JSON.stringify(a) == JSON.stringify(b) }
