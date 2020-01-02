var vm = require('vm');
var fs = require('fs');
var createExpect = require('./createExpect');
var locateBabelrc = require('./locateBabelrc');

var transpile;
var hasBabel = false;
try {
  var babelCore = require.main.require('babel-core');
  var babelrc = locateBabelrc();
  var babelOptions = JSON.parse(fs.readFileSync(babelrc, 'utf-8'));
  hasBabel = true;

  transpile = function transpile(code) {
    var babelResult = babelCore.transform(code, {
      ...babelOptions,
      sourceMaps: false,
      compact: false
    });

    return babelResult.code.replace(/'use strict';/, '');
  };
} catch (e) {
  transpile = function transpile(code) {
    // Avoid "Identifier '...' has already been declared"
    return code.replace(/\b(?:const|let)\s/g, 'var ');
  };
}

function isPromise(value) {
  return value && typeof value.then === 'function';
}

function getErrorMessage(expect, format, error) {
  if (error) {
    if (error.getErrorMessage) {
      var expectForOutput = error.expect || expect;
      var output = expectForOutput.createOutput
        ? expectForOutput.createOutput(format)
        : expectForOutput.output.clone(format);
      return error.getErrorMessage({ output: output }).toString(format);
    } else if (error.output) {
      return error.output.toString(format);
    } else {
      return expect.output
        .clone(format)
        .error((error && error.message) || '')
        .toString(format);
    }
  } else {
    return '';
  }
}

function getOutputString(expect, format, output) {
  if (typeof output === 'string') {
    return output;
  } else if (output) {
    return expect.inspect(output, 6, format).toString();
  } else {
    return '';
  }
}

module.exports = async function(snippets, allOptions) {
  var oldGlobal = Object.assign({}, global);
  const { captureOutput, ...options } = allOptions || {};
  const baseExpect = createExpect({ ...options, theme: 'notheme' });

  // allow modules to be imported
  global.require = require;

  // attach any custom globals that have been specified
  const customGlobals = options.globals || {};
  if (!Object.prototype.hasOwnProperty.call(customGlobals, 'expect')) {
    global.expect = createExpect(options);
  }
  for (const [variable, createVariable] of Object.entries(customGlobals)) {
    global[variable] = createVariable(options, {
      expect: global.expect || baseExpect
    });
  }

  // grab a reference before any modifications are done to it
  let testExpect;
  if (global.expect && global.expect._topLevelExpect) {
    testExpect = global.expect;
    global.expect = global.expect.clone();
  } else {
    testExpect = null;
  }

  if (hasBabel) {
    var preambleSeparator =
      '\n//---------------------preamble----------------------\n';
    var separator = '\n//---------------------separator---------------------\n';

    var exampleSnippets = snippets.filter(function(snippet) {
      return snippet.lang === 'javascript' && snippet.flags.evaluate;
    });

    if (exampleSnippets.length) {
      var codeForTranspilation =
        preambleSeparator +
        exampleSnippets
          .map(function(snippet) {
            return snippet.flags.async
              ? `(function () {${snippet.code}})();`
              : snippet.code;
          })
          .join(separator);

      var transpiledCode = transpile(codeForTranspilation);
      var transpiledSnippets = transpiledCode.split(
        new RegExp(`${preambleSeparator}|${separator}`)
      );

      var preamble = transpiledSnippets[0];
      const remainingSnippets = transpiledSnippets.slice(1);

      vm.runInThisContext(preamble);

      for (const [i, transpiledSnippet] of remainingSnippets.entries()) {
        exampleSnippets[i].code = transpiledSnippet;
      }
    }
  }

  for (const snippet of snippets) {
    if (snippet.lang === 'javascript' && snippet.flags.evaluate) {
      try {
        if (snippet.flags.freshExpect) {
          if (!testExpect) {
            throw new Error(
              'cannot clone with missing or invalid expect global for freshExpect'
            );
          }
          global.expect = testExpect.clone();
        }

        let output;
        if (snippet.flags.async) {
          var promise = vm.runInThisContext(
            hasBabel
              ? snippet.code
              : `(function () {${transpile(snippet.code)}})();`
          );

          if (!isPromise(promise)) {
            throw new Error(
              `Async code block did not return a promise or throw\n${snippet.code}`
            );
          }

          output = await promise;
        } else {
          let codeToRun = hasBabel ? snippet.code : transpile(snippet.code);
          if (captureOutput) {
            codeToRun = `(function () {${codeToRun}})();`;
          }
          output = vm.runInThisContext(codeToRun);
        }

        if (captureOutput) {
          const expectForOutput = testExpect ? global.expect : baseExpect;
          snippet.htmlOutput = getOutputString(expectForOutput, 'html', output);
          snippet.output = getOutputString(expectForOutput, 'text', output);
        }
      } catch (e) {
        const expectForError = testExpect ? global.expect : baseExpect;
        snippet.htmlErrorMessage = getErrorMessage(expectForError, 'html', e);
        snippet.errorMessage = getErrorMessage(expectForError, 'text', e);
      }
    }
  }

  for (const key of Object.keys(global)) {
    if (!(key in oldGlobal)) {
      delete global[key];
    }
  }

  // inline function used for compatibility with node 8
  for (const key of Object.keys(oldGlobal)) {
    global[key] = oldGlobal[key];
  }
};
