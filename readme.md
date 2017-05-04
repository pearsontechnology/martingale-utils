# Martingale Utility Functions


## Install

Available once we opensource everything

```sh
yarn add martingale-utilities
```

## Methods

### parseObjectPath(path)

##### Arguments

 * path - String or Array of String

##### Returns

Array of String

### getObjectValue(path, obj, defaultValue)

##### Arguments

 * path - String or Array of String
 * obj - Source object, Array, or value
 * defaultValue - If value at "path" is not found what value should be returned

##### Returns

Value found at "path" or "defaultValue"

### isNumeric(value)

##### Arguments

 * value - Anything

##### Returns

Boolean, true if the value passed in is a numeric value or represents a numeric value, false if not.

### flatten(array)

##### Arguments

 * array - Array of Array's

##### Returns

Flattend Array

### betterType(of)


##### Arguments

 * of - Thing to get the type of

##### Returns

String representation of the type of the value passed in "of"
 * Host object (provided by the JS environment)	Implementation-dependent
 * Undefined	"undefined"
 * Null	"null"
 * Boolean	"boolean"
 * Number	"number"
 * String	"string"
 * Symbol "symbol"
 * Function object "function"
 * Array "array"
 * RegExp "regex"
 * Date "date"
 * Any other object	"object"


### isTheSame(v1, v2)

##### Arguments

 * v1 - A value to check
 * v2 - A value to compare "v1" against

##### Returns

True if v1 is exactly equal to v2, False otherwise.

### clone(src)

##### Arguments

 * src - Source value to clone

##### Returns

A deep clone of the value passed in src

### merge(...args)

##### Arguments

 * ...args - Array of arguments to be merged into a single return value

##### Returns

Single merged value of "...args"
