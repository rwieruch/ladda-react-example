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
    const {
      hits,
      ms,
      cached,
      wasCached,
    } = this.state;

    return (
      <div className="page">
        <Header>
          <h1>Search Hacker News with Ladda</h1>
          <Search
            onSearch={this.onSearch}
          />
          <SearchInformationWithMaybe
            ms={ms}
            cached={cached}
            wasCached={wasCached}
          />
        </Header>
        <Content>
          <MainContent>
            <HitsListWithMaybe
              list={hits}
            />
          </MainContent>
          <SideContent>
            <CacheWithMaybe
              cached={cached}
              onNukeCache={this.onNukeCache}
            />
          </SideContent>
        </Content>
      </div>
    );
  }
}

const Header = ({
  children
}) =>
  <div className="page-header">
    {children}
  </div>

const Content = ({
  children
}) =>
  <div className="page-content">
    {children}
  </div>

const MainContent = ({
  children
}) =>
  <div className="page-content-main">
    {children}
  </div>

const SideContent = ({
  children
}) =>
  <div className="page-content-side">
    {children}
  </div>

const HitsList = ({
  list,
}) =>
  <div className="table">
    {list.map(item => <HitItem key={item.objectID} item={item} />)}
  </div>

const HitItem = ({
  item,
}) =>
  <div className="table-row">
    {item.title}
  </div>

const Cache = ({
  cached,
  onNukeCache,
}) =>
  <div>
    <div className="interactions" style={{ marginBottom: '20px' }}>
      <Button
        onClick={onNukeCache}
      >
        Nuke Cache
      </Button>
    </div>
    <CacheList
      cached={cached}
    />
  </div>

const Search = ({
  onSearch,
}) => {
  let input;

  return (
    <form
      className="interactions"
      onSubmit={(e) => onSearch(e, input.value.toLowerCase())}
    >
      <input ref={node => input = node} />
      <Button type="submit">Search</Button>
    </form>
  );
}

const SearchInformation = ({
  ms,
  cached,
  wasCached,
}) =>
  <div>
    <MsLabel
      ms={ms}
      wasCached={wasCached}
    />
    <CacheLabel
      cached={cached}
    />
  </div>

const CacheList = ({ cached }) =>
  <div className="table">
    {cached.map(item => <CacheItem key={item} item={item} />)}
  </div>

const CacheItem = ({ item }) =>
  <div className="table-row">
    {item}
  </div>

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

const CacheLabel = ({
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

const HitsListWithMaybe = withMaybe(HitsList, 'list')
const SearchInformationWithMaybe = withMaybe(SearchInformation, 'cached')
const CacheWithMaybe = withMaybe(Cache, 'cached')

export default App;
