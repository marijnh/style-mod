<!-- To edit this file, edit /src/README.md, not /README.md -->

# style-module

Minimal CSS module shim for generating CSS rules and anonymouse class
names for sets of style declarations and attaching such a set to a
document or shadow root.

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

 * `new `**`StyleModule`**`(classes: Object< Style >)`\
   Create a style module for the classes specified by the properties
   of `classes`.

 * **`mount`**`(root: Document | ShadowRoot, priority: ?Priority) → Object< string >`\
   Mount this module in a given document or shadow root. Returns an
   object mapping names to generated CSS class names.

   By default, rules are defined in the order in which they are
   mounted, making those mounted later take precedence in case of an
   otherwise equal selector precedence. You can pass
   `StyleModule.lowPriority` or `StyleModule.highPriority` as second
   argument to explicitly move the rules above or below rules with
   default priority. Within a priority level, rules remain defined
   in mount order.

   This method can be called multiple times with the same root
   cheaply.

 * `static `**`lowPriority`**`: Priority`

 * `static `**`normalPriority`**`: Priority`

 * `static `**`highPriority`**`: Priority`


Where the `Style` type is defined as:

 * **`Style`**`: Object< Style | string >`\
   A style is an object that, in the simple case, maps CSS property
   names to strings holding their values, as in `{color: "red",
   fontWeight: "bold"}`. The property names can be given in
   camel-case—the library will insert a dash before capital letters
   when converting them to CSS.

   A property in a style object can also be a sub-selector, which
   extends the current context to add a pseudo-selector or a child
   selector. Such a property should contain a `&` character, which
   will be replaced by the current selector. For example `{"&:before":
   {content: '"hi"'}}`. Sub-selectors and regular properties can
   freely be mixed in a given object. Any property containing a `&` is
   assumed to be a sub-selector.

   Finally, a property can specify an @-block to be wrapped around the
   styles defined inside the object that's the property's value. For
   example to create a media query you can do `{"@media screen and
   (min-width: 400px)": {...}}`.


