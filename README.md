<!-- To edit this file, edit /src/README.md, not /README.md -->

# style-module

Minimal CSS module shim with first-class sets of classes and a
mechanism for extending such a set.

Using it would look something like this:

```javascript
const {StyleModule} = require("style-module")
const myModule = new StyleModule({
  main: {
    fontFamily: "Georgia, 'Nimbus Roman No9 L'",
    margin: "0"
  },
  callout: {
    color: "red",
    fontWeight: "bold",
    ":hover": {color: "orange"}
  }
})

document.body.className = myModule.mount(document).main
```

To extend that module, you'd do something like this:

```javascript
const extension = new StyleModule({
  callout: {
    textDecoration: "underline"
  }
})

// This will make the element both red and underlined
document.querySelector("strong").className =
  myModule.mount(document, [extended]).callout
```

This code is open source, released under an MIT license.
    
## Documentation

### class StyleModule

A style module is an object that defines a number of CSS
classes.

Style modules should be created once and stored somewhere, as
opposed to re-creating them every time you need them. The amount of
CSS rules generated for a given DOM root is bounded by the amount
of style modules that were used. To avoid leaking rules, don't
create these dynamically, but treat them as one-time allocations.

 * `new `**`StyleModule`**`(names: Object< Style >)`\
   Create a style module for the classes specified by the property
   names in `names`.

 * **`mount`**`(root: Document | ShadowRoot, extend: ?[StyleModule] = []) → Object< string >`\
   Mount this module with the given extensions in a given document
   or shadow root. Returns an object mapping names to (sets of)
   CSS class names, ensuring that the extensions take priority over
   this module and previously listed extensions when those classes
   are applied.

   This method can be called multiple times with the same inputs
   cheaply. New CSS rules will only be generated when necessary, and
   a cache is used so that usually even the creation of a new object
   isn't necessary.


Where the `Style` type is defined as:

 * **`Style`**`: Object< Style | string >`\
   A style is an object that, in the simple case, maps CSS property
   names to strings holding their values, as in `{color: "red",
   fontWeight: "bold"}`. The property names can be given in
   camel-case—the library will insert a dash before capital letters
   when converting them to CSS.

   A property in a style object can also be a sub-selector, such as a
   pseudo-selector or a child selector. For example `{":before":
   {content: '"hi"'}}` will create a rule whose selector is the
   current class with `:before` appended after it. Sub-selectors and
   regular properties can freely be mixed in a given object. Any
   property not starting with a dash or a letter or an @-sign is
   assumed to be a sub-selector.

   When a property is has a name like `"parent(foo)"`, it specifies a
   parent class selector. It should hold another object that specifies
   styles that apply to this element when it is inside an element with
   the class name defined by `foo` in another style module. That
   module must be provided in the `parentModule` property of the value
   object.

   To prevent an empty style from being omitted from the output
   (because you want to use it in an `parent(...)` rule), you can give
   it an `export: true` property.

   Finally, a property can specify an @-block to be wrapped around the
   styles defined inside the object that's the property's value. For
   example to create a media query you can do `{"@media screen and
   (min-width: 400px)": {...}}`.


