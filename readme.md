# Freddo

> Minimal assertion testing framework for APIs

[![Build Status](https://travis-ci.com/k4m4/freddo.svg?branch=master)](https://travis-ci.com/k4m4/freddo)[![Bundlephobia Size](https://badgen.net/bundlephobia/min/freddo)](https://bundlephobia.com/result?p=freddo)

## Install

```
~ ❯❯❯ npm install freddo --save-dev
```

## Usage

```js
const { freddo, expr, exists } = require('freddo');

(async () => {
  const isSvg = str => str.trim().startsWith('<svg ')
  await freddo('https://badgen.net/packagephobia/install/sha-regex')
    .status(200)
    .header('content-type', 'image/svg+xml;charset=utf-8')
    .body(isSvg)
    .ensure()
})();

(async () => {
  /*
  {
      "hash":"0000000000000538200a48202ca6340e983646ca088c7618ae82d68e0c76ef5a",
      "time":1325794737,
      "block_index":841841,
      "height":160778,
      "txIndexes":[13950369,13950510,13951472]
  }
  */
  await freddo('https://blockchain.info/latestblock')
    .status(200)
    .body(exists, expr('.hash'))
    .body(exists, expr('.time'))
    .body(([time]) => {
      const DAY = 24 * 60 * 60 * 1000
      return {
          result: time > Date.now()/1000 - DAY,
          error: 'Most recent blockchain block is unrealistically old'
      }
    }, expr('.time'))
    .body(exists, expr('.block_index'))
    .body(([blockHeight]) => {
      return {
        result: blockHeight >= 500000,
        error: 'Block height of blockchain tip is insufficient'
      }
    }, expr('.height'))
    .ensure()
})();

(async () => {
  await freddo('https://httpstat.us/301')
    .redirectsTo('https://httpstat.us/301')
})();
```

### Example uses with testing frameworks

#### [AVA](https://github.com/avajs/ava)

```js
import * as t from 'ava'
const { freddo, expr, exists } = require('freddo')
const validator = require('validator')

t('/ip/json', async t => {
  t.is(await freddo("https://locate.now.sh/ip/json/")
    .status(200)
    .header('content-type', 'application/json; charset=utf-8')
    .body(validator.isJSON)
    .body(exists, expr('.ip')), true)
})
```

#### [Mocha](https://github.com/mochajs/mocha)

```js
const { freddo, expr, exists } = require('freddo')
const validator = require('validator')
const assert = require('assert').strict

describe('/ip/json', function() {
  it('should serve a JSON response', async function() {
    assert.ok(await freddo("https://locate.now.sh/ip/json/")
      .status(200)
      .header('content-type', 'application/json; charset=utf-8')
      .body(validator.isJSON)
      .body(exists, expr('.ip')))
  })
})
```

## API

### freddo(url)

Returns a `Promise` for a modified [`got`](https://github.com/sindresorhus/got) request object.

#### url

Type: `string`

### freddo.status(expected)

Compares equality of `status-code` with `expected` and returns a `boolean`.

#### expected

Type: `string | function`

### freddo.header(entity, expected)

Compares equality of `header` with key `type` to `expected` and returns a `boolean`.

#### entity

Type: `string`

e.g. `content-type`, `content-length`, `origin`, etc.

#### expected

Type: `string | function`

### freddo.body(expected[, expression])

Compares equality of `body` with `expected` and returns a `boolean`.

#### expected

Type: `string | function`

#### expression

Type: `Expression object`

*Note*: When an `expression` is given, an array containing the matched values is returned. Therefore, in this case, an `exprected` parameter function should treat its argument as an array and destructure it accordingly (e.g. `([x]) => x == 'bar'`).

### freddo.redirectsTo(url)

Checks whether `status` code contains a redirection code (i.e. `301`, `302`, `303`, `307`, or `308`) and whether there exists a `location` `header` entity containing `url`.

#### url

Type: `string`

### freddo.ensure()

Asserts the `boolean` response of the preceding functions.

### expr(pattern)

Returns an `Expression object` that can be passed as an `expression` parameter to the `freddo.body` function (see above) so as to find a value matching the `pattern`.

#### pattern

Type: [`JSPath path expression`](https://github.com/dfilatov/jspath#documentation)

### exists()

Returns a function that can be passed as an `expected` parameter to the `freddo.body` function to check whether a `pattern` match is found.

## License

MIT © [Nikolaos Kamarinakis](https://nikolaskama.me)