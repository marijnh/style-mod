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

document.body.className = myModule.class.main
```

To extend that module, you'd do something like this:

```javascript
const extended = myModule.extend({
  callout: {
    textDecoration: "underline"
  }
})

// This will make the element both red and underlined
document.querySelector("strong").className = extended.class.callout
```

This code is open source, released under an MIT license.
    
## Documentation

### class StyleModule

A style module is an object that defines a number of CSS
classes.

Style modules should be created once and stored somewhere, as
opposed to re-creating them every time you need them, because this
module does not do any kind of deduplication, and will continue
creating new classes for new instances.

 * `new `**`StyleModule`**`(classes: Object< Style >)`\
   Create a style module for the classes specified by the property
   names in `classes`.

 * **`class`**`: Object< string >`\
   An object mapping the class identifiers from
   the input object to CSS class names that can be used in your
   DOM.

 * **`mount`**`(root: Document | ShadowRoot)`\
   Mount this module in a given document or shadow root. Can be
   called multiple times cheaply (the classes will only be added the
   first time it is called for a given root).

 * **`extend`**`(classes: Object< Style >) → StyleModule`\
   Extend this module with additional styles. This will generate
   classes for the specified styles as usual, but bind the
   properties of `.classes` in the return value to contain both the
   CSS class for the old rule and the new rule (when both were
   defined), so that additional styling may be added.


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

   Finally, a property can specify an @-block to be wrapped around the
   styles defined inside the object that's the property's value. For
   example to create a media query you can do `{"@media screen and
   (min-width: 400px)": {...}}`.


