function sym(name, random) {
  return typeof Symbol == "undefined"
    ? "__" + name + (random ? Math.floor(Math.random() * 1e8) : "")
    : random ? Symbol(name) : Symbol.for(name)
}

const COUNT = sym("\u037c"), SET = sym("styleSet", 1), DATA = sym("data", 1)
const top = typeof global == "undefined" ? window : global

// :: (Object<Style>, number, ?{priority: ?number}) → Object<string>
// Instances of this class bind the property names
// from `spec` to CSS class names that assign the styles in the
// corresponding property values.
//
// A style module can only be used in a given DOM root after it has
// been _mounted_ there with `StyleModule.mount`.
//
// By default, rules are defined in the order in which they are
// mounted, making those mounted later take precedence in case of an
// otherwise equal selector precedence. You can pass a number (may be
// fractional) between 0 for low priority or 2 for high priority as
// second argument to explicitly move the rules above or below rules
// with default priority. Within a priority level, rules remain
// defined in mount order.
//
// Style modules should be created once and stored somewhere, as
// opposed to re-creating them every time you need them. The amount of
// CSS rules generated for a given DOM root is bounded by the amount
// of style modules that were used. To avoid leaking rules, don't
// create these dynamically, but treat them as one-time allocations.
export function StyleModule(spec, options) {
  let priority = options && options.priority
  if (priority == null) priority = 1
  if (priority < 0 || priority > 2 || +priority != priority) throw new RangeError("Invalid priority: " + priority)
  this[DATA] = {rules: [], mounted: [], priority}
  top[COUNT] = top[COUNT] || 1
  for (let name in spec) {
    let className = this[name] = "\u037c" + (top[COUNT]++).toString(36)
    renderStyle("." + className, spec[name], this[DATA].rules)
  }
}

// :: (union<Document, ShadowRoot>, Object<string>)
//
// Mount the given module in the given DOM root, which ensures that
// the CSS rules defined by the module are available in that context.
//
// This function can be called multiple times with the same arguments
// cheaply—rules are only added to the document once per root.
StyleModule.mount = function(root, module) {
  let data = module[DATA]
  if (data.mounted.indexOf(root) > -1) return
  ;(root[SET] || new StyleSet(root)).mount(data.rules, data.priority)
  data.mounted.push(root)
}

StyleModule.prototype = Object.create(null)

class StyleSet {
  constructor(root) {
    this.root = root
    root[SET] = this
    this.styleTag = (root.ownerDocument || root).createElement("style")
    let target = root.head || root
    target.insertBefore(this.styleTag, target.firstChild)
    this.priorities = []
    this.rules = []
  }

  mount(rules, priority) {
    let pos = 0
    while (pos < this.priorities.length && this.priorities[pos] <= priority) pos++
    this.rules.splice(pos, 0, ...rules)
    let prioArray = []
    for (let i = 0; i < rules.length; i++) prioArray[i] = priority
    this.priorities.splice(pos, 0, ...prioArray)

    let sheet = this.styleTag.sheet
    if (sheet) {
      for (let i = 0; i < rules.length; i++)
        sheet.insertRule(rules[i], pos++)
    } else {
      this.styleTag.textContent = this.rules.join("\n")
    }
  }
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
      props.push(prop.replace(/_.*/, "").replace(/[A-Z]/g, l => "-" + l.toLowerCase()) + ": " + spec[prop])
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
