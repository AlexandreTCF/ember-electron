'use strict'

const util = require('util')
const TapReporter = require('testem/lib/reporters/tap_reporter')

function CustomTapReporter () {
  this.out = process.stdout
  this.silent = false
  this.stoppedOnError = null
  this.id = 1
  this.total = 0
  this.pass = 0
  this.skipped = 0
  this.failed = 0
  this.results = []
  this.errors = []
  this.logs = []
}

util.inherits(CustomTapReporter, TapReporter)

CustomTapReporter.prototype.report = function (prefix, data) {
  if (data.items && data.items.length > 0) {
    data.error = {
      actual: data.items[0].actual,
      expected: data.items[0].expected,
      stack: data.items[0].source,
      message: data.items[0].message
    }
  }

  CustomTapReporter.super_.prototype.report.call(this, prefix, data)
}

module.exports = new CustomTapReporter()
