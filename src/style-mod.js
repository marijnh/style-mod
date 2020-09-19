const C = "\u037c"
const COUNT = typeof Symbol == "undefined" ? "__" + C : Symbol.for(C)
const SET = typeof Symbol == "undefined" ? "__styleSet" + Math.floor(Math.random() * 1e8) : Symbol("styleSet")
const top = typeof global == "undefined" ? window : global

// Style modules encapsulate a set of CSS rules defined from
// JavaScript. Their definitions are only available in a given DOM
// root after it has been _mounted_ there with `StyleModule.mount`.
//
// Style modules should be created once and stored somewhere, as
// opposed to re-creating them every time you need them. The amount of
// CSS rules generated for a given DOM root is bounded by the amount
// of style modules that were used. So to avoid leaking rules, don't
// create these dynamically, but treat them as one-time allocations.
export class StyleModule {
  // :: (Object<Style>, ?{process: (string) → string, extend: (string, string) → string})
  // Create a style module from the given spec.
  //
  // When `process` is given, it is called on regular (non-`@`)
  // selector properties to provide the actual selector. When `extend`
  // is given, it is called when a property containing an `&` is
  // found, and should somehow combine the `&`-template (its first
  // argument) with the selector (its second argument) to produce an
  // extended selector.
  constructor(spec, options) {
    this.rules = []
    let {process, extend} = options || {}

    function processSelector(selector) {
      if (/^@/.test(selector)) return [selector]
      let selectors = selector.split(",")
      return process ? selectors.map(process) : selectors
    }

    function render(selectors, spec, target) {
      let local = [], isAt = /^@(\w+)\b/.exec(selectors[0])
      if (isAt && spec == null) return target.push(selectors[0] + ";")
      for (let prop in spec) {
        if (/&/.test(prop)) {
          render(selectors.map(s => extend ? extend(prop, s) : prop.replace(/&/, s)), spec[prop], target)
        } else if (typeof spec[prop] == "object") {
          if (!isAt) throw new RangeError("The value of a property (" + prop + ") should be a primitive value.")
          render(isAt[1] == "keyframes" ? [prop] : processSelector(prop), spec[prop], local)
        } else {
          local.push(prop.replace(/_.*/, "").replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + spec[prop] + ";")
        }
      }
      if (local.length || isAt && isAt[1] == "keyframes") target.push(selectors.join(",") + " {" + local.join(" ") + "}")
    }

    for (let prop in spec) render(processSelector(prop), spec[prop], this.rules)
  }

  // :: () → string
  // Generate a new unique CSS class name.
  static newName() {
    let id = top[COUNT] || 1
    top[COUNT] = id + 1
    return C + id.toString(36)
  }

  // :: (union<Document, ShadowRoot>, union<[StyleModule], StyleModule>)
  //
  // Mount the given set of modules in the given DOM root, which ensures
  // that the CSS rules defined by the module are available in that
  // context.
  //
  // Rules are only added to the document once per root.
  //
  // Rule order will follow the order of the modules, so that rules from
  // modules later in the array take precedence of those from earlier
  // modules. If you call this function multiple times for the same root
  // in a way that changes the order of already mounted modules, the old
  // order will be changed.
  static mount(root, modules) {
    (root[SET] || new StyleSet(root)).mount(Array.isArray(modules) ? modules : [modules])
  }
}

let adoptedSet = null

class StyleSet {
  constructor(root) {
    if (root.adoptedStyleSheets && typeof CSSStyleSheet != "undefined") {
      if (adoptedSet) {
        root.adoptedStyleSheets = [adoptedSet.sheet].concat(root.adoptedStyleSheets)
        return root[SET] = adoptedSet
      }
      this.sheet = new CSSStyleSheet
      root.adoptedStyleSheets = [this.sheet].concat(root.adoptedStyleSheets)
      adoptedSet = this
    } else {
      this.styleTag = (root.ownerDocument || root).createElement("style")
      let target = root.head || root
      target.insertBefore(this.styleTag, target.firstChild)
    }
    this.modules = []
    root[SET] = this
  }

  mount(modules) {
    let sheet = this.sheet
    let pos = 0 /* Current rule offset */, j = 0 /* Index into this.modules */
    for (let i = 0; i < modules.length; i++) {
      let mod = modules[i], index = this.modules.indexOf(mod)
      if (index < j && index > -1) { // Ordering conflict
        this.modules.splice(index, 1)
        j--
        index = -1
      }
      if (index == -1) {
        this.modules.splice(j++, 0, mod)
        if (sheet) for (let k = 0; k < mod.rules.length; k++)
          sheet.insertRule(mod.rules[k], pos++)
      } else {
        while (j < index) pos += this.modules[j++].rules.length
        pos += mod.rules.length
        j++
      }
    }

    if (!sheet) {
      let text = ""
      for (let i = 0; i < this.modules.length; i++)
        text += this.modules[i].rules.join("\n") + "\n"
      this.styleTag.textContent = text
    }
  }
}

// Style::Object<union<Style,string>>
//
// A style is an object that, in the simple case, maps CSS property
// names to strings holding their values, as in `{color: "red",
// fontWeight: "bold"}`. The property names can be given in
// camel-case—the library will insert a dash before capital letters
// when converting them to CSS.
//
// If you include an underscore in a property name, it and everything
// after it will be removed from the output, which can be useful when
// providing a property multiple times, for browser compatibility
// reasons.
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
