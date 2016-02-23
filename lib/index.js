/****************************************************************************
 Local State Props: Higher-Order-Component that injects state as props.state
 MIT License (c) Juan Soulie, 2016
 npmjs.com/package/state-props
 ****************************************************************************/

var React = require('react');

var defaultOptions = {
  state: 'state',           // prop name for the state (falsey = each property is a prop)
  localState: 'localState', // name in internal element's state
};

function stateProps(initialState,stateMutations,mergeProps,opt) {
  if (!initialState) initialState = {};
  if (!stateMutations) stateMutations = { setState: function(changes){return function(state){ return _assign({},state,changes); };} };
  if (!mergeProps) mergeProps = function(mutators,ownProps) {return _assign({},mutators,ownProps);};
  opt = opt ? _assign({},defaultOptions,opt) : defaultOptions;

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
        // [UNDOCUMENTED]: mutagen can be overridden by "opt.mutagen" (used by redux-state-props):
        var boundMutagen = (opt.mutagen || reactMutagen)(this);
        if (boundMutagen.unmount) this.componentWillUnmount = boundMutagen.unmount;

        this.mutators = {};
        for (var k in stateMutations)
          if (stateMutations.hasOwnProperty(k))
            this.mutators[k] = generateMutator(boundMutagen,stateMutations[k]);
        this.childProps = mergeProps(this.mutators,this.props);
      },
      componentWillReceiveProps: function(nextProps) {
        this.childProps = mergeProps(this.mutators,nextProps);
      },
      shouldComponentUpdate: function(nextProps,nextState) {
        return (nextState[opt.localState]!==this.state[opt.localState]) || nextProps!==this.props;
      },
      render: function () {
        this.childProps.state = this.state[opt.localState];
        return React.createElement(ComponentClass, this.childProps);
      }
    });
  };
}

function generateMutator(mutagen,mutation) {
  if (Array.isArray(mutation)) return generateMutatorFromArray(mutagen,mutation);
  if (mutation.apply) return mutagen(mutation);
}

// [UNDOCUMENTED]: mutation is an array (to deprecate)
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
