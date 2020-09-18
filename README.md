<!-- To edit this file, edit /src/README.md, not /README.md -->

# style-mod

Minimal CSS module shim for generating CSS rules and anonymous class
names for sets of style declarations and attaching such a set to a
document or shadow root.

Using it would look something like this:

```javascript
const {StyleModule} = require("style-mod")
const myModule = new StyleModule({
  main: {
    fontFamily: "Georgia, 'Nimbus Roman No9 L'",
    margin: "0"
  },
  callout: {
    color: "red",
    fontWeight: "bold",
    "&:hover": {color: "orange"}
  }
})
StyleModule.mount(document, myModule)
document.body.className = myModule.main
```

This code is open source, released under an MIT license.
    
## Documentation

 * **`StyleModule`**


Where the `Style` type is defined as:

 * **`Style`**`: Object< Style | string >`\
   A style is an object that, in the simple case, maps CSS property
   names to strings holding their values, as in `{color: "red",
   fontWeight: "bold"}`. The property names can be given in
   camel-case—the library will insert a dash before capital letters
   when converting them to CSS.

   If you include an underscore in a property name, it and everything
   after it will be removed from the output, which can be useful when
   providing a property multiple times, for browser compatibility
   reasons.

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


