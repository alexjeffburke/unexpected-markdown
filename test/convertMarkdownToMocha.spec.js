/* eslint-disable no-labels, mocha/no-nested-tests, mocha/no-identical-title */

var convertMarkdownToMocha = require('../lib/convertMarkdownToMocha');
var esprima = require('esprima');
var escodegen = require('escodegen');

function codeToString(obj) {
  var ast = esprima.parse(obj);
  return escodegen.generate(ast);
}

var expect = require('unexpected')
  .clone()
  .use(require('magicpen-prism'))
  .use(require('unexpected-snapshot'))
  .addAssertion('<string> to come out as <assertion>', function (
    expect,
    subject,
    value
  ) {
    const converted = codeToString(
      convertMarkdownToMocha(subject).code
    ).replace(/ {4}var fileName = '<inline code>'[\s\S]*$/, '}');

    expect.errorMode = 'nested';
    return expect.shift(converted);
  });

var synchronousSuccessfulSnippet =
  "var foo = 'abc';\n" + "expect(foo, 'to equal', 'abc');\n";

var returningSuccessfulSnippet =
  "var blah = 'abc';\n" +
  "if (blah === 'abc') {\n" +
  '  return expect.promise(function (resolve, reject) {\n' +
  '    setImmediate(resolve);\n' +
  '  });\n' +
  '} else {\n' +
  '  return 456;\n' +
  '}\n';

var synchronousThrowingSnippet =
  "var bar = 'abc';\n" + "expect(bar, 'to equal', 'def');\n";

function fences(code, language) {
  return `\`\`\`${language || 'js'}\n${code}\n\`\`\`\n`;
}

describe('convertMarkdownToMocha', function () {
  it('should convert a returning snippet expected to be successful', function () {
    expect(
      fences(returningSuccessfulSnippet),
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var blah = 'abc';
                          if (blah === 'abc') {
                              __returnValue1 = expect.promise(function (resolve, reject) {
                                  setImmediate(resolve);
                              });
                              break example1;
                          } else {
                              __returnValue1 = 456;
                              break example1;
                          }
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert a returning snippet expected to fail', function () {
    expect(
      `${fences(returningSuccessfulSnippet)}\n${fences(
        'theErrorMessage',
        'output'
      )}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should fail with the correct error message', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var blah = 'abc';
                          if (blah === 'abc') {
                              __returnValue1 = expect.promise(function (resolve, reject) {
                                  setImmediate(resolve);
                              });
                              break example1;
                          } else {
                              __returnValue1 = 456;
                              break example1;
                          }
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          var message = err.isUnexpected ? err.getErrorMessage('text').toString() : err.message;
                          expect(message, 'to equal', 'theErrorMessage');
                      } else {
                          throw new Error('expected example to fail');
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert a returning snippet expected to fail followed by another one', function () {
    expect(
      `${fences(returningSuccessfulSnippet)}\n${fences(
        'theErrorMessage',
        'output'
      )}\n${fences(synchronousSuccessfulSnippet)}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should fail with the correct error message', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var blah = 'abc';
                          if (blah === 'abc') {
                              __returnValue1 = expect.promise(function (resolve, reject) {
                                  setImmediate(resolve);
                              });
                              break example1;
                          } else {
                              __returnValue1 = 456;
                              break example1;
                          }
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          var message = err.isUnexpected ? err.getErrorMessage('text').toString() : err.message;
                          expect(message, 'to equal', 'theErrorMessage');
                      } else {
                          throw new Error('expected example to fail');
                      }
                  }
              });
              it('example #2 (<inline code>:18:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var foo = 'abc';
                          expect(foo, 'to equal', 'abc');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert non-returning snippet expected to be successful', function () {
    expect(
      fences(synchronousSuccessfulSnippet),
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var foo = 'abc';
                          expect(foo, 'to equal', 'abc');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert a non-returning snippet expected to fail', function () {
    expect(
      `${fences(synchronousThrowingSnippet)}\n${fences(
        'theErrorMessage',
        'output'
      )}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should fail with the correct error message', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var bar = 'abc';
                          expect(bar, 'to equal', 'def');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          var message = err.isUnexpected ? err.getErrorMessage('text').toString() : err.message;
                          expect(message, 'to equal', 'theErrorMessage');
                      } else {
                          throw new Error('expected example to fail');
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert a non-returning snippet expected to fail followed by another one', function () {
    expect(
      `${fences(synchronousThrowingSnippet)}\n${fences(
        'theErrorMessage',
        'output'
      )}\n${fences(synchronousSuccessfulSnippet)}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should fail with the correct error message', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var bar = 'abc';
                          expect(bar, 'to equal', 'def');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          var message = err.isUnexpected ? err.getErrorMessage('text').toString() : err.message;
                          expect(message, 'to equal', 'theErrorMessage');
                      } else {
                          throw new Error('expected example to fail');
                      }
                  }
              });
              it('example #2 (<inline code>:12:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var foo = 'abc';
                          expect(foo, 'to equal', 'abc');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });

  it('should convert a synchronously succeeding snippet followed by another one', function () {
    expect(
      `${fences(synchronousSuccessfulSnippet)}\n${fences(
        synchronousThrowingSnippet
      )}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var foo = 'abc';
                          expect(foo, 'to equal', 'abc');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
              it('example #2 (<inline code>:8:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var bar = 'abc';
                          expect(bar, 'to equal', 'def');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });

  it('should inject a fresh unexpected clone before a snippet with #freshContext:true', function () {
    expect(
      `${fences(synchronousSuccessfulSnippet)}\n${fences(
        synchronousThrowingSnippet,
        'javascript#freshContext:true'
      )}`,
      'to come out as',
      'to equal snapshot',
      expect.unindent`
          function isPromise(obj) {
              return obj && typeof obj.then === 'function';
          }
          if (typeof unexpected === 'undefined') {
              unexpected = require('unexpected');
              unexpected.output.preferredWidth = 80;
          }
          describe('<inline code>', function () {
              it('example #1 (<inline code>:2:1) should succeed', function () {
                  var __returnValue1;
                  example1:
                      try {
                          var foo = 'abc';
                          expect(foo, 'to equal', 'abc');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
              it('example #2 (<inline code>:8:1) should succeed', function () {
                  expect = unexpected.clone();
                  var __returnValue1;
                  example1:
                      try {
                          var bar = 'abc';
                          expect(bar, 'to equal', 'def');
                      } catch (err) {
                          return endOfExample1(err);
                      }
                  if (isPromise(__returnValue1)) {
                      return __returnValue1.then(function () {
                          return endOfExample1();
                      }, endOfExample1);
                  } else {
                      return endOfExample1();
                  }
                  function endOfExample1(err) {
                      if (err) {
                          expect.fail(err);
                      }
                  }
              });
          });
      `
    );
  });
});
