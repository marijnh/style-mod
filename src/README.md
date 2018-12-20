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

@StyleModule

Where the `Style` type is defined as:

@Style
