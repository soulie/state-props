# State Props

Add state to stateless components through props, using declarative-style.

## Usage

**stateProps** is a *Higher-order Component* that inserts state into a React component as `props.state`.

By default it inserts two props (`props.state`) and (`props.setState`) that are similar to `this.state` and `this.setState` in a regular React component. For example:

```
function Stateless ({state, setState}) {
  return (
    <div style="background-color:{state.color}; margin:20px">
      <button onClick={setState({color:"blue"})}>Blue</button>
      <button onClick={setState({color:"red"})}>Red</button>
    </button>
  );
}
const Stateful = stateProps({color:"silver"})(Stateless);
```

## Arguments

The `stateProps` function accepts the following arguments (all optional):
```
stateProps ( initialState, mutations, mergeProps )
```

* `initialState` is a plain object describing the initial state passed as `props.state`. By default, it is am *empty object*:
  ```
  initialState = {}
  ```

* `mutations` is an object with methods. Each method is a state **mutation** (see below). By default, it provides the `setState` mutation:
  ```
  mutations = { setState: changes => state => Object.assign({},state,changes) }
  ```

* `mergeProps` is a function that takes the **props** generated from the **mutations** and those passed to the component and returns the **props** to be passed to the wrapped component. It is called every time the component's `props` change. By default it simply merges them:
  ```
  mergeProps = (mutators,ownProps) => Object.assign({},mutators,ownProps)
  ```


## Mutations
A **mutation** is a function returning the new state based on some arguments:
```
(...args) => nextState
```
If the next state needs to be based also on the *current state*, the mutation can also return a function that takes the current state as argument, thus, the **mutation** is a function returning a function:
```
(...args) => (state) => nextState
```
The *outer function* takes any number of arguments, and the *inner function* takes a `state`, returning the **next state**. For example:
```
const addToCounter = (increase) => (state) => ({
  counter: state.counter + increase
});
```
Both functions should compose as a *pure function*. I.e., they should not cause side effects, nor use values other than those provided as arguments to both. The arguments shall be considered immutable.

The `mutations` argument passed to `stateProps` shall be an object with each method being one of these **mutations**. For example:
```
const stateMutations = {
  set: (x) => state => ({counter:x}),
  increment: () => state => ({counter: state.counter+x})
}
```

## Stateful stateless components

React 0.14 introduced a new way to [define entire stateless components as
simple functions](https://facebook.github.io/react/docs/reusable-components.html#stateless-functions).

This is an amazing feature, and a step toward implementing fully
functional components. Ideally, components should have the minimum amount
of state (or no state at all) and obtain as much as possible of its data input
in the form of `props`. But, sometimes, components *really* need to have their own
state, or it simply makes sense they own the sate and not some abstract *store*.
This package aims to bring this to stateless components, without losing their purely functional nature.

## Example

```
function StatelessComponent ({state, increment, set}) {
  return (
    <div>
      counter: {state.counter}
      <button onClick={increment}>Increment</button>
      <button onClick={()=>set(100)}>Set to 100</button>
    </div>
  );
}
const initialState = {
  counter:0
};
const mutations = {
  set: x => state => {counter:x},
  increment: () => state => ({
    counter: state.counter + 1
  })
};
const Component = stateProps(initialState,mutations)(StatelessComponent);
```
The `stateProps` Higher-order Component keeps the current state internally and passes it to the stateless component as `props.state`. It also injects a **mutator** function in the `props` for every **mutation** passed as second argument.

### Mutation _vs_ mutator
* A **mutation** is one of the methods passed to `stateProps`. Each mutation simply *describes* a state change:
  ```
  (...args) => (state) => nextState
  ```
* A **mutator** is a function passed to the actual component as a `prop`. Calling this function actually performs the change  described by the *mutation* with the same name. `stateProps` automatically generates the **mutators** from the **mutations** it is passed.

A **mutation** *describes* a change; a **mutator** *performs* that change in the component's state.

## Redux

Redux uses **actions** and **reducers** to separate imperative behavior (with
functions that dispatch actions) from declarative state changes (reducers that
translate actions to state changes).

The declarative nature of this package's **mutations**, makes them a pretty similar
concept to **redux**'s reducers
(both take a state and return its replacement). The advantage
of considering only **local state** is that actions are dispatched by a
component and reduced for the state of that same component, making the actions'
shape trivial and its creation repetitive. By using `mutations` objects,
we combine actions and reducers into one,
reducing boilerplate while preserving the declarative nature of reducers.

There is a version of this package that stores the state of your components in a **redux store**.
Please see ([redux-state-props](https://npmjs.com/package/redux-state-props)).

## Example
See [Todo-List Example](https://github.com/soulie/state-props-examples/tree/master/todolist)

## License

MIT License (c) Juan Soulie, 2016
