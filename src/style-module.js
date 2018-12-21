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
  // Create a style module for the classes specified by the property
  // names in `names`.
  constructor(names) {
    this.ids = Object.keys(names)
    this.rules = renderStyles(names)
    this.cache = []
    this.cIndex = 0
  }

  // :: (union<Document, ShadowRoot>, [StyleModule]) → Object<string>
  //
  // Mount this module with the given extensions in a given document
  // or shadow root. Returns an object mapping names to (sets of)
  // CSS class names, ensuring that the extensions take priority over
  // this module and previously listed extensions when those classes
  // are applied.
  //
  // This method can be called multiple times with the same inputs
  // cheaply. New CSS rules will only be generated when necessary, and
  // a cache is used so that usually even the creation of a new object
  // isn't necessary.
  mount(root, extend = []) {
    cache: for (let i = 0; i < this.cache.length; i += 3) {
      let ext = this.cache[i + 1]
      if (this.cache[i] != root || ext.length != extend.length) continue
      for (let j = 0; j < ext.length; j++) if (ext[j] != extend[j]) continue cache
      return this.cache[i + 2]
    }
    let classes = (root._styleModuleStyleSet || new StyleSet(root)).mount([this].concat(extend))
    this.cache[this.cIndex] = root
    this.cache[this.cIndex + 1] = extend
    this.cache[this.cIndex + 2] = classes
    this.cIndex = (this.cIndex + 3) % 12
    return classes
  }
}

class StyleSet {
  constructor(root) {
    root._styleModuleStyleSet = this
    this.styleTag = (root.ownerDocument || root).createElement("style")
    ;(root.head || root).appendChild(this.styleTag)
    this.mounted = []
    this.classID = 1
  }

  mount(modules) {
    // To ensure the modules' rules are declared in the right order,
    // this searches the mounted modules from start to end, never
    // going back before a previously mounted module. This may in rare
    // cases (two modules being used with inverted order requirements)
    // lead to a module being mounted more than one time.
    let pos = 0, classes = {}
    for (let i = 0; i < modules.length; i++) {
      let module = modules[i], found = -1
      for (let j = pos; j < this.mounted.length; j++)
        if (this.mounted[j].module == module) { found = j; break }
      if (found < 0) this.mountAt(found = pos, module)
      pos = found + 1
      let add = this.mounted[found].classes
      for (let j = 0; j < modules[0].ids.length; j++) {
        let id = modules[0].ids[j]
        if (i == 0) classes[id] = add[id] || ""
        else if (Object.prototype.hasOwnProperty.call(add, id)) classes[id] += " " + add[id]
      }
    }
    return classes
  }

  // Mount the given module at the given index.
  mountAt(pos, module) {
    let offset = 0, classes = {}, sheet = this.styleTag.sheet
    for (let i = 0; i < pos; i++) offset += this.mounted[i].module.rules.length
    for (let i = 0; i < module.rules.length; i++) {
      let rule = module.rules[i].replace(/\.%([\w-]+)%/g, (_, id) => {
        return "." + (Object.prototype.hasOwnProperty.call(classes, id) ? classes[id]
          : classes[id] = "C_" + (this.classID++).toString(36))
      })
      sheet.insertRule(rule, offset++)
    }
    this.mounted.splice(pos, 1, {module, classes})
  }
}

function renderStyles(names) {
  let rules = []
  for (let name in names)
    renderStyle(".%" + name + "%", names[name], rules)
  return rules
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

// Style::Object<union<Style,string>>
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
