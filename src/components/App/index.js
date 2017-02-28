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

  onSearch = (e, query) => {
    e.preventDefault();

    const t0 = performance.now();

    api.hackernews.getList(query)
      .then(({ hits }) => {
        this.setState(updateState(hits, calculateRequestDuration(t0).toString(), query));
      });
  }

  onNukeCache = () => {
    api.fakeNukeCache.nuke()
      .then(() => this.setState({ cached: [] }));
  }

  render() {
    const { hits, ...r } = this.state;
    return (
      <div className="page">
        <Header
          {...r}
          onNukeCache={this.onNukeCache}
          onSearch={this.onSearch}
        />
        <ListWithMaybe
          list={hits}
        />
      </div>
    );
  }
}

const List = ({
  list,
}) =>
  <div className="table">
    {list.map(item => <Item key={item.objectID} item={item} />)}
  </div>

const Item = ({
  item,
}) =>
  <div className="table-row">
    {item.title}
  </div>

const Header = ({
  cached,
  ms,
  wasCached,
  onSearch,
  onNukeCache,
}) => {
  let input;

  return (
    <form
      className="search-form"
      onSubmit={(e) => onSearch(e, input.value.toLowerCase())}
    >
      <p>Search Hacker News with Ladda Cache</p>
      &nbsp;
      <input ref={node => input = node} />
      <Button type="submit">Search</Button>
      &nbsp;
      <MsLabelWithMaybe
        ms={ms}
        wasCached={wasCached}
      />
      <CacheDashWithMaybe
        cached={cached}
      />
      <CachedLabelWithMaybe
        cached={cached}
      />
      &nbsp;
      <NukeButtonWithMaybe
        cached={cached}
        onClick={onNukeCache}
      >
        Nuke Cache
      </NukeButtonWithMaybe>
    </form>
  );
}

const CacheDash = () =>
  <Dash />;

const Dash = () =>
  <span>&nbsp;-&nbsp;</span>

const MsLabel = ({
  ms,
  wasCached,
}) =>
  <p style={getMsLabelStyle(wasCached)}>
    Request Duration: <strong>{ms} ms</strong>
    &nbsp;
    <MsLabelSuffix wasCached={wasCached} />
  </p>

const MsLabelSuffix = ({
  wasCached,
}) =>
  wasCached
    ? <span>[Cache Hit]</span>
    : <span>[Cache Miss]</span>

const CachedLabel = ({
  cached
}) =>
  <p>
    All Cached Requests: <strong>{cached.join(', ' )}</strong>
  </p>

const Button = ({
  type = 'button',
  onClick = () => {},
  children,
}) =>
  <button
    type={type}
    onClick={onClick}
  >
    {children}
  </button>

const withMaybe = (Component, key) => (props) =>
  props[key] && props[key].length
    ? <Component {...props} />
    : null

const MsLabelWithMaybe = withMaybe(MsLabel, 'ms')
const CachedLabelWithMaybe = withMaybe(CachedLabel, 'cached')
const ListWithMaybe = withMaybe(List, 'list')
const CacheDashWithMaybe = withMaybe(CacheDash, 'cached')
const NukeButtonWithMaybe = withMaybe(Button, 'cached')

export default App;
