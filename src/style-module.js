// ::- A style module is an object that defines a number of CSS
// classes.
//
// Style modules should be created once and stored somewhere, as
// opposed to re-creating them every time you need them. The amount of
// CSS rules generated for a given DOM root is bounded by the amount
// of style modules that were used. To avoid leaking rules, don't
// create these dynamically, but treat them as one-time allocations.
export class StyleModule {
  // :: (Object<Style>)
  // Create a style module for the classes specified by the properties
  // of `classes`.
  constructor(classes) {
    this.classes = classes
    this.mounted = []
  }

  // :: (union<Document, ShadowRoot>, Priority) → Object<string>
  //
  // Mount this module in a given document or shadow root. Returns an
  // object mapping names to generated CSS class names.
  //
  // This method can be called multiple times with the same root
  // cheaply.
  mount(root, priority = StyleModule.normalPriority) {
    for (let i = 0; i < this.mounted.length; i += 2)
      if (this.mounted[i] == root) return this.mounted[i + 1]
    let result = (root[setProp] || new StyleSet(root)).mount(this, priority)
    this.mounted.push(root, result)
    return result
  }
}

// :: Priority
StyleModule.lowPriority = 0
// :: Priority
StyleModule.normalPriority = 1
// :: Priority
StyleModule.highPriority = 2

const setProp = typeof Symbol == "undefined" ? "_styleSet" + Math.floor(Math.random() * 1e16) : Symbol("styleSet")
const countProp = "\u037cN"

class StyleSet {
  constructor(root) {
    this.root = root
    root[setProp] = this
    root[countProp] = root[countProp] || 1
    this.styleTag = (root.ownerDocument || root).createElement("style")
    let target = root.head || root
    target.insertBefore(this.styleTag, target.firstChild)
    this.insertPos = [0, 0, 0]
    this.rules = []
  }

  makeClasses(module) {
    let classes = {}
    for (let name in module.classes) classes[name] = "\u037c" + (this.root[countProp]++).toString(36)
    return classes
  }

  mount(module, priority) {
    let classes = this.makeClasses(module)
    let rules = renderRules(module.classes, classes)
    let pos = this.insertPos[priority]
    ;this.rules.splice(pos, 0, ...rules)
    let sheet = this.styleTag.sheet
    if (sheet) {
      for (let i = 0; i < rules.length; i++)
        sheet.insertRule(rules[i], pos++)
    } else {
      this.styleTag.textContent = this.rules.join("\n")
    }
    for (let i = priority; i < this.insertPos.length; i++)
      this.insertPos[i] += rules.length
    return classes
  }
}

function renderRules(classes, names) {
  let rules = []
  for (let name in classes)
    renderStyle("." + names[name], classes[name], rules)
  return rules
}

function renderStyle(selector, spec, output) {
  if (typeof spec != "object") throw new RangeError("Expected style object, got " + JSON.stringify(spec))
  let props = []
  for (let prop in spec) {
    if (/^@/.test(prop)) {
      let local = []
      renderStyle(selector, spec[prop], local)
      output.push(prop + " {" + local.join(" ") + "}")
    } else if (/&/.test(prop)) {
      renderStyle(prop.replace(/&/g, selector), spec[prop], output)
    } else {
      if (typeof spec[prop] == "object") throw new RangeError("The value of a property (" + prop + ") should be a primitive value.")
      props.push(prop.replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + spec[prop])
    }
  }
  if (props.length) output.push(selector + " {" + props.join("; ") + "}")
}

// Style::Object<union<Style,string>>
//
// A style is an object that, in the simple case, maps CSS property
// names to strings holding their values, as in `{color: "red",
// fontWeight: "bold"}`. The property names can be given in
// camel-case—the library will insert a dash before capital letters
// when converting them to CSS.
//
// A property in a style object can also be a sub-selector, which
// extends the current context to add a pseudo-selector or a child
// selector. Such a property should contain a `&` character, which
// will be replaced by the current selector. For example `{"&:before":
// {content: '"hi"'}}`. Sub-selectors and regular properties can
// freely be mixed in a given object. Any property containing a `&` is
// assumed to be a sub-selector.
//
// Finally, a property can specify an @-block to be wrapped around the
// styles defined inside the object that's the property's value. For
// example to create a media query you can do `{"@media screen and
// (min-width: 400px)": {...}}`.
