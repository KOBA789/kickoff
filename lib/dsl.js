var vm = require('vm'),
    cs = require('coffee-script');

function DSL () {
  this.methods = [];
}

DSL.prototype.define = function (name) {
  this.methods.push(name);
};

DSL.prototype._bind = function (name, actions) {
  return function (/* args */) {
    actions.push({
      name: name,
      args: Array.prototype.slice.call(arguments)
    });
    return actions;
  };
};

DSL.prototype._createContext = function (defaultContext) {
  var context, actions = [];

  defaultContext = defaultContext || {};
  
  context = this.methods.map(function (methodName) {
    return {
      key: methodName,
      value: this._bind(methodName, actions)
    };
  }.bind(this)).reduce(function (prev, curr) {
    prev[curr.key] = curr.value;
    return prev;
  }, defaultContext);

  return context;
};

DSL.prototype.run = function (coffee, context) {
  var ctx = vm.createContext(this._createContext(context)),
      script = vm.createScript(cs.compile(coffee, {bare: true}));
  return script.runInNewContext(ctx);
};

if (!module.parents) {
  var dsl = new DSL();
  dsl.define('repository');
  dsl.define('flavor');
  
  console.log(dsl.run([
    "repository 'github', name",
    "flavor 'npm'",
    "flavor 'mocha'",
    "flavor 'chai'"
  ].join('\n'), {name: 'hoge'}));
}