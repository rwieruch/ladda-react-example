import React, { Component } from 'react';
import api from '../../api';
import './style.css';

const GREEN = '#2fda2f';
const RED = '#da2f2f';

const getMsLabelStyle = (wasCached) =>
  ({ color: wasCached ? GREEN : RED })

const uniq = (value, index, self) =>
  self.indexOf(value) === index

const updateCached = (cached, query) =>
  [...cached, query].filter(uniq)

const updateWasCached = (cached, query) =>
  !!~cached.indexOf(query)

const updateState = (hits, ms, query) => ({ cached }) =>
  ({
    hits,
    ms,
    cached: updateCached(cached, query),
    wasCached: updateWasCached(cached, query),
  })

const calculateRequestDuration = (t0) =>
  (performance.now() - t0).toFixed(2)

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      hits: [],
      ms: 0,
      cached: [],
      wasCached: false,
    };
  }

  onSubmit = (e, query) => {
    e.preventDefault();

    const t0 = performance.now();

    api.hackernews.getList(query)
      .then(({ hits }) => {
        this.setState(updateState(hits, calculateRequestDuration(t0).toString(), query));
      });
  }

  render() {
    const { hits, ...r } = this.state;
    return (
      <div className="page">
        <Header
          {...r}
          onSubmit={this.onSubmit}
        />
        <ListWithMaybe
          list={hits}
        />
      </div>
    );
  }
}

const List = ({ list }) =>
  <div className="table">
    {list.map(item => <Item key={item.objectID} item={item} />)}
  </div>

const Item = ({ item }) =>
  <div className="table-row">{item.title}</div>

const Header = ({ cached, ms, wasCached, onSubmit }) => {
  let input;

  return (
    <form className="search-form" onSubmit={(e) => onSubmit(e, input.value.toLowerCase())}>
      <p>Search Hacker News with Ladda Cache</p>
      &nbsp;
      <input ref={node => input = node} />
      <button type="submit">Search</button>
      &nbsp;
      <MsLabelWithMaybe ms={ms} wasCached={wasCached} />
      {!!(ms && cached) && <p>&nbsp;-&nbsp;</p>}
      <CachedLabelWithMaybe cached={cached} />
    </form>
  );
}

const MsLabel = ({ ms, wasCached }) =>
  <p style={getMsLabelStyle(wasCached)}>
    Request Duration: <strong>{ms} ms</strong>
    &nbsp;
    <MsLabelSuffix wasCached={wasCached} />
  </p>

const MsLabelSuffix = ({ wasCached }) =>
  wasCached
    ? <span>[Cache Hit]</span>
    : <span>[Cache Miss]</span>

const CachedLabel = ({ cached }) =>
  <p>
    All Cached Requests: <strong>{cached.join(', ' )}</strong>
  </p>

const withMaybe = (Component, key) => (props) =>
  props[key] && props[key].length
    ? <Component {...props} />
    : null

const MsLabelWithMaybe = withMaybe(MsLabel, 'ms')
const CachedLabelWithMaybe = withMaybe(CachedLabel, 'cached')
const ListWithMaybe = withMaybe(List, 'list')

export default App;
