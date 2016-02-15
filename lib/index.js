/****************************************************************************
  Local State Props: Higher-Order-Component that injects state as props.state
    MIT License (c) Juan Soulie, 2016
  npmjs.com/package/state-props
****************************************************************************/

var React = require('react');

var defaultOptions = {
  state: 'state',           // prop name for the state (falsey = each property is a prop)
  mutators: '',             // prop name for mutators (falsey = each mutator is a prop)
  localState: 'localState', // name in internal element's state
};

function stateProps(initialState,stateMutations,opt) {
  opt = opt ? _assign({},defaultOptions,opt) : defaultOptions;

  var subState = _sub(opt.state);
  var subMutators =  _sub(opt.mutators);


  return function(ComponentClass) {
    return React.createClass({
      getInitialState: function () {
        // [UNDOCUMENTED]: if initialState is a function, pass it the props and use returned object
        var state = {};
        state[opt.localState] = initialState && initialState.apply ? initialState(this.props) : initialState;
        return state;
      },
      replaceLocalState: function(nextState) {
        if (nextState.apply) {
          this.setState(function(elemState) {
            var state = {};
            state[opt.localState] = nextState(elemState[opt.localState]);
            return state;
          });
        }
        else {
          var state = {};
          state[opt.localState] = nextState;
          this.setState(state);
        }
      },
      componentWillMount: function() {
        // [UNDOCUMENTED]: if mutators is a function, pass it the props and use returned object
        var elemsStateMutations = stateMutations.apply ? stateMutations(this.props) : stateMutations;
        // [UNDOCUMENTED]: mutagen can be overridden by "opt.mutagen" (used by redux-state-props):
        var boundMutagen = (opt.mutagen || reactMutagen)(this);

        if (boundMutagen.unmount) this.componentWillUnmount = boundMutagen.unmount;

        var actions = {};
        for (var k in elemsStateMutations)
          if (elemsStateMutations.hasOwnProperty(k))
            actions[k] = generateMutator(boundMutagen,elemsStateMutations[k]);
        this.mergeMutators = subMutators(actions);
      },
      render: function () {
        return React.createElement(ComponentClass, _assign({}, this.props, this.mergeMutators, subState(this.state[opt.localState])));
      },
      contextTypes: {
        store:React.PropTypes.shape({dispatch:React.PropTypes.func.required})
      }
    });
  };
}

function generateMutator(mutagen,mutation) {
  if (Array.isArray(mutation)) return generateMutatorFromArray(mutagen,mutation);
  if (mutation.apply) return mutagen(mutation);
}

function generateMutatorFromArray(mutagen,mutationArray) {
  var rawAction = mutationArray[0];
  if ( (!rawAction) || (!rawAction.apply) )
    return error ('Invalid mutation: the first element in an async mutation shall be a function');
  var fnArgs = [];                   // other elements are state changes
  for (var i = 1; i < mutationArray.length; ++i) {
    fnArgs.push(generateMutator(mutagen,mutationArray[i]));
  }
  return function () { // (...arguments)
    var res = rawAction.apply(this, arguments);
    if (res && res.apply) {
      res.apply(this, fnArgs);
    }
  };
}

// returns a mutator from a mutation
function reactMutagen (elemThis) {
  return function(mutation) {
    return function() {
      var transformation = mutation.apply(this, arguments);
      elemThis.replaceLocalState(transformation);
    }
  };
}

module.exports = stateProps;

// --------------------------------------------------------------------------
function error(msg) { throw new Error(msg); }
var _assign=Object.assign||function(x){for(var i=1;i<arguments.length;++i){var a=arguments[i];for(var k in a)if(a.hasOwnProperty(k))x[k]=a[k];}return x;};
// _sub(name)(value) : returns object with "name" property set to "value", or "value"
function _sub(k) {
  if (k) return function(x) {var R={}; R[k]=x; return R};
  else return function(x) {return x;}
}
