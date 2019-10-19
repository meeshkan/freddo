const got = require('got')
const JSPath = require('jspath')
const assert = require('assert').strict

const freddo = url => new Test(url)

function Test(url, options = null) {
    this.dataObj = {
        url,
        options,
        body: {},
        headers: {},
        statusCode: null,
        error: null
    }
    this.promise = Promise.resolve(null)
    this.request()
}

Test.prototype.extend = function(promise, that) {
    for (const key in that) {
        promise[key] = that[key]
    }
}

Test.prototype.next = function(what) {
    this.promise = this.promise.then(what)
    this.extend(this.promise, this)
    return this.promise
}

Test.prototype.request = function() {
    return this.next(async () => {
        let response
        if (this.dataObj.options != undefined) {
            response = await got(this.dataObj.url, this.dataObj.options)
        } else {
            response = await got(this.dataObj.url)
        }
        this.dataObj.headers = response.headers
        this.dataObj.body = response.body
        this.dataObj.statusCode = response.statusCode
        return true
    })
}

Test.prototype.verify = async function(key, expected, isHeader) {
    let check = expected
    let value, location
    if (key instanceof Expression) {
        if (typeof this.dataObj.body != 'string') {
            this.dataObj.body = JSON.stringify(this.dataObj.body)
        }
        value = key.apply(JSON.parse(this.dataObj.body))
        location = `expression ${JSON.stringify(key.expression)}`
    } else {
        if (isHeader) {
            value = this.dataObj.headers[key]
        } else {
            value = this.dataObj[key]
        }
        if (typeof value === 'undefined') {
            throw new Error(`Key ${JSON.stringify(key)} does not exist`)
        }
        location = `key ${JSON.stringify(key)}`
    }
    if (typeof expected !== 'function') {
        check = (actual, location) => {
            try {
                assert.deepStrictEqual(actual, expected)
            } catch (e) {
                return {
                    result: false,
                    error: `Expected ${location} to be ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
                }
            }
            return true
        }
    }
    let result = check(value, location)
    let error = `Custom assertion failed: ${check}`
    if (typeof result !== 'boolean') {
        if (typeof result.result === 'undefined') {
            throw new Error('Custom assertion functions must return a boolean or a {result, error} object')
        }
        if (typeof result.error !== 'undefined') {
            error = result.error
        }
        result = result.result
    }
    if (!result) {
        this.dataObj.error = error
    }
    return result
}

Test.prototype.expect = function(key, expected, isHeader = false) {
    return this.next((prev) => prev && this.verify(key, expected, isHeader))
}

Test.prototype.status = function(expected) {
    return this.expect('statusCode', expected)
}

Test.prototype.header = function(key, expected) {
    return this.expect(key, expected, true)
}

Test.prototype.body = function(expected, expression = null) {
    if (expression == null) {
        return this.expect('body', expected)
    }
    return this.expect(expression, expected)
}

Test.prototype.redirectsTo = function(url) {
    return this.status((code) => [301, 302, 303, 307, 308].includes(code))
               .header('location', url)
}

Test.prototype.ensure = async function() {
    if (!(await this)) {
        throw new Error(this.dataObj.error)
    }
}

const exists = (actual, location) => {
    if (actual.length != 0) {
        return true
    }
    return {
        result: false,
        error: `Expected ${location} to contain a value, but it does not exist`
    }
}

const expr = expression => new Expression(expression)

class Expression {
    constructor(expression) {
        this.expression = expression
    }
    apply(haystack) {
        let result = JSPath.apply(this.expression, haystack)
        return result
    }
}

module.exports = { freddo, expr, exists }