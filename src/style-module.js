export default class StyleModule {
  constructor(classes) {
    let rendered = renderClasses(classes)
    this.rules = rendered.rules
    this.classes = rendered.classes
    this.mounted = []
    this.parent = null
  }

  mount(root) {
    (root.styleModuleStyleSet || new StyleSet(root)).mount(this)
  }

  extend(classes) {
    let child = new StyleModule(classes)
    child.parent = this
    for (let cls in this.classes) {
      let extended = Object.hasOwnProperty.call(child.classes, cls) ? child.classes[cls] : null
      child.classes[cls] = (extended ? extended + " " : "") + this.classes[cls]
    }
    return child
  }
}

class StyleSet {
  constructor(root) {
    root.styleModuleStyleSet = this
    this.styleTag = document.createElement("style")
    ;(root.head || root).appendChild(this.styleTag)
  }

  mount(module) {
    if (module.mounted.indexOf(this) > -1) return
    let sheet = this.styleTag.sheet
    if (!sheet) return
    if (module.parent) this.mount(module.parent)
    for (let i = 0; i < module.rules.length; i++) sheet.insertRule(module.rules[i], sheet.length)
    module.mounted.push(this)
  }
}

let classID = 1

function renderClasses(spec) {
  let classes = {}, rules = []
  for (let name in spec) {
    let className = "-_-" + (classID++).toString(36)
    classes[name] = className
    renderStyle("." + className, spec[name], rules)
  }
  return {classes, rules}
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
      renderStyle(selector + prop, spec[prop], output)
    } else {
      props.push(prop + ": " + spec[prop] + ";")
    }
  }
  if (props.length) output.push(selector + "{" + props.join(" ") + "}")
}
