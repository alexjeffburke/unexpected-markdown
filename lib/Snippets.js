var extractSnippets = require('./extractSnippets');
var evaluateSnippets = require('./evaluateSnippets');

class Snippets {
  constructor(snippets) {
    this.items = snippets;
  }

  async evaluate(options) {
    await evaluateSnippets(this.items, options);
    return this;
  }

  get(index) {
    return this.items[index];
  }

  getTests() {
    var tests = [];
    var evaluatedExampleIndex;

    for (const [index, snippet] of this.items.entries()) {
      var flags = snippet.flags;

      switch (snippet.lang) {
        case 'javascript':
          if (flags.evaluate) {
            evaluatedExampleIndex = index;
            tests.push({
              code: snippet.code,
              flags: flags
            });
          }
          break;
        case 'output':
          if (evaluatedExampleIndex === index - 1) {
            tests[tests.length - 1].output = snippet.code;
          }
          break;
      }
    }

    return tests;
  }
}

module.exports = {
  fromMarkdown: function(markdown) {
    return new Snippets(extractSnippets(markdown));
  }
};
