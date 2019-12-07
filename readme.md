# Freddo

> Minimal assertion testing framework for APIs

[![Build Status](https://travis-ci.com/k4m4/freddo.svg?branch=master)](https://travis-ci.com/k4m4/freddo) [![Install Size](https://packagephobia.now.sh/badge?p=freddo)](https://packagephobia.now.sh/result?p=freddo)

## Install

```
~ ❯❯❯ npm install freddo --save-dev
```

## Usage

```js
const { freddo, expr, exists } = require('freddo');

(async () => {
  const isSvg = str => str.trim().startsWith('<svg ')
  /*
    <svg width="120.5" height="20" viewBox="0 0 1205 200" xmlns="http://www.w3.org/2000/svg">
    ...
    </svg>
  */
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
    .body(exists, expr('.txIndexes'))
    .ensure()
})();

(async () => {
  /*
    HTTP/1.1 301 Moved Permanently
  */
  await freddo('https://httpstat.us/301')
    .redirectsTo('https://httpstat.us/301')
    .ensure()
})();
```

### Example uses with testing frameworks

#### [AVA](https://github.com/avajs/ava)

```js
import * as test from 'ava'
import m from '.'
import { freddo, expr, exists } from 'freddo'
import micro from 'micro'
import testListen from 'test-listen'
import validator from 'validator'

let url
test.before(async () => {
  url = await testListen(micro(m))
})

test('/ip/json', async t => {
  t.is(await freddo(url)
    .status(200)
    .header('content-type', 'application/json; charset=utf-8')
    .body(validator.isJSON)
    .body(exists, expr('.ip')), true)
})
```

#### [Mocha](https://github.com/mochajs/mocha)

```js
import { freddo, expr, exists } from 'freddo'
import validator from 'validator'
import assert from 'assert'

describe('/ip/json', function() {
  it('should serve a JSON response', async function() {
    assert.strict.ok(await freddo("https://locate.now.sh/ip/json/")
      .status(200)
      .header('content-type', 'application/json; charset=utf-8')
      .body(validator.isJSON)
      .body(exists, expr('.ip')))
  })
})
```

## API

### freddo(url[, options])

Returns a `Promise` for a modified [`got`](https://github.com/sindresorhus/got) request object.

#### url

Type: `string | object`

The URL to request, as a string, a [`https.request` options object](https://nodejs.org/api/https.html#https_https_request_options_callback), or a [WHATWG `URL`](https://nodejs.org/api/url.html#url_class_url). (Adapted from [`got`'s documentation](https://github.com/sindresorhus/got))

#### options

Type: `object`

Any of the [`https.request`](https://nodejs.org/api/https.html#https_https_request_options_callback) options. (Adapted from [`got`'s documentation](https://github.com/sindresorhus/got))

### freddo.status(expected)

Compares equality of `status-code` with `expected`, and returns a `boolean`.

#### expected

Type: `string | function`

### freddo.header(entity, expected)

Compares equality of `entity` `header` with `expected`, and returns a `boolean`.

#### entity

Type: `string`

e.g. `content-type`, `content-length`, `origin`, etc.

#### expected

Type: `string | function`

### freddo.body(expected[, expression])

Compares equality of `body` with `expected`, and returns a `boolean`.

#### expected

Type: `string | function`

#### expression

Type: `Expression object`

*Note*: When an `expression` is given, an array containing the matched values is returned. Therefore, in this case, an `expected` parameter function should treat its argument as an array and destructure it accordingly (e.g. `([x]) => x == 'bar'`).

### freddo.redirectsTo(url)

Checks whether `status` code contains a redirection code (i.e. `301`, `302`, `303`, `307`, or `308`) and whether there exists a `location` `header` entity containing `url`.

#### url

Type: `string`

### freddo.expect(key, expected)

Compares equality of `response.key` (where `response` is [`got`'s `response` object](https://github.com/sindresorhus/got#response)) with `expected`, and returns a `boolean`.

*Note*: `freddo.ensure('body', expected)` is the same as `freddo.body(expected)` (and the same applies for `freddo.status`).

#### key

Type: `string`

Any of [`got`'s `response` object](https://github.com/sindresorhus/got#response) keys.

#### expected

Type: `string | function`

### freddo.ensure()

Asserts the `boolean` response of the preceding functions.

### expr(pattern)

Returns an `Expression object` that can be passed as an `expression` parameter to the `freddo.body` function (see above) so as to find a value matching the `pattern`.

#### pattern

Type: [`JSPath path expression`](https://github.com/dfilatov/jspath#documentation)

### exists()

Returns a function that can be passed as an `expected` parameter to the `freddo.body` function to check whether a `pattern` match is found.


## Contributing

Thanks for wanting to contribute! We will soon have a contributing page
detailing how to contribute. Meanwhile, feel free to star this repository, open issues,
and ask for more features and support.

Please note that this project is governed by the [Unmock Community Code of Conduct](https://github.com/unmock/code-of-conduct). By participating in this project, you agree to abide by its terms.

## License

MIT © [Meeshkan](https://meeshkan.com/)
