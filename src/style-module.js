// ::- A style module is an object that defines a number of CSS
// classes.
//
// Style modules should be created once and stored somewhere, as
// opposed to re-creating them every time you need them, because this
// module does not do any kind of deduplication, and will continue
// creating new classes for new instances.
export class StyleModule {
  // :: (Object<Style>)
  // Create a style module for the classes specified by the property
  // names in `classes`.
  constructor(classes) {
    let rendered = renderClasses(classes)
    this.rules = rendered.rules
    // :: Object<string> An object mapping the class identifiers from
    // the input object to CSS class names that can be used in your
    // DOM.
    this.class = rendered.classNames
    this.mounted = []
    this.parent = null
  }

  // :: (Union<Document, ShadowRoot>)
  // Mount this module in a given document or shadow root. Can be
  // called multiple times cheaply (the classes will only be added the
  // first time it is called for a given root).
  mount(root) {
    (root.styleModuleStyleSet || new StyleSet(root)).mount(this)
  }

  // :: (Object<Style>) → StyleModule
  // Extend this module with additional styles. This will generate
  // classes for the specified styles as usual, but bind the
  // properties of `.classes` in the return value to contain both the
  // CSS class for the old rule and the new rule (when both were
  // defined), so that additional styling may be added.
  extend(classes) {
    let child = new StyleModule(classes)
    child.parent = this
    for (let cls in this.class) {
      let extended = Object.hasOwnProperty.call(child.class, cls) ? child.class[cls] : null
      child.class[cls] = this.class[cls] + (extended ? " " + extended + " " : "")
    }
    return child
  }
}

class StyleSet {
  constructor(root) {
    root.styleModuleStyleSet = this
    this.styleTag = (root.ownerDocument || root).createElement("style")
    ;(root.head || root).appendChild(this.styleTag)
  }

  mount(module) {
    if (module.mounted.indexOf(this) > -1) return
    let sheet = this.styleTag.sheet
    if (!sheet) return
    if (module.parent) this.mount(module.parent)
    for (let i = 0; i < module.rules.length; i++) sheet.insertRule(module.rules[i], sheet.cssRules.length)
    module.mounted.push(this)
  }
}

let classID = 1

function renderClasses(classes) {
  let classNames = {}, rules = []
  for (let name in classes) {
    let className = "C_" + (classID++).toString(36)
    classNames[name] = className
    renderStyle("." + className, classes[name], rules)
  }
  return {classNames, rules}
}

function renderStyle(selector, spec, output) {
  if (typeof spec != "object") throw new RangeError("Expected style object, got " + JSON.stringify(spec))
  let props = []
  for (let prop in spec) {
    if (/^@/.test(prop)) {
      let local = []
      renderStyle(selector, spec[prop], local)
      output.push(prop + " {" + local.join("\n") + "}")
    } else if (/^[a-zA-Z-]/.test(prop)) {
      props.push(prop.replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + spec[prop])
    } else {
      renderStyle(selector + prop, spec[prop], output)
    }
  }
  if (props.length) output.push(selector + " {" + props.join("; ") + "}")
}

// Style::Object<Union<Style,string>>
//
// A style is an object that, in the simple case, maps CSS property
// names to strings holding their values, as in `{color: "red",
// fontWeight: "bold"}`. The property names can be given in
// camel-case—the library will insert a dash before capital letters
// when converting them to CSS.
//
// A property in a style object can also be a sub-selector, such as a
// pseudo-selector or a child selector. For example `{":before":
// {content: '"hi"'}}` will create a rule whose selector is the
// current class with `:before` appended after it. Sub-selectors and
// regular properties can freely be mixed in a given object. Any
// property not starting with a dash or a letter or an @-sign is
// assumed to be a sub-selector.
//
// Finally, a property can specify an @-block to be wrapped around the
// styles defined inside the object that's the property's value. For
// example to create a media query you can do `{"@media screen and
// (min-width: 400px)": {...}}`.
