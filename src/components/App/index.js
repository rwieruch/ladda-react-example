import React, { Component } from 'react';
import Highlight from 'react-highlight';
import { getList } from '../../api/hackernews';
import api, { TTL } from '../../api';
import './style.css';

/* style */

const GREEN = '#2fda2f';
const RED = '#da2f2f';

const getSignalColor = (is) =>
  is ? GREEN : RED

const getSignalBackgroundColor = (is) =>
  ({ background: getSignalColor(is) })

const getSignalTextColor = (is) =>
  ({ color: getSignalColor(is) })

/* ttl */

const toS = (ms) =>
  ms / 1000

const toMs = (s) =>
  s * 1000

const getRemainingInS = (end, now) =>
  toS(end - now).toFixed(0)

const getRemainingToTtl = (timestamp) =>
  getRemainingInS(timestamp + toMs(TTL), Date.now())

const isAfterTtl = (timestamp) =>
  timestamp < Date.now() - toMs(TTL)

/* util */

const getValues = ({ value }) =>
  value

const uniq = ({ value }, i, self) =>
  self.map(getValues).indexOf(value) === i

/* cache information */

const getCacheValue = (query) => ({ value }) =>
  value === query

const isExpired = (cached, query) =>
  isAfterTtl(cached.find(getCacheValue(query)).timestamp);

const isCached = (cached, query) =>
  !!~cached.map(getValues).indexOf(query)

const updateWasCached = (cached, query) =>
  isCached(cached, query) && !isExpired(cached, query)

const updateTimestamoOfExpired = (cached, query) => {
  const index = cached.findIndex(getCacheValue(query));
  const updatedValue = {value: query, timestamp: Date.now()};

  return [
    ...cached.slice(0, index),
    updatedValue,
    ...cached.slice(index + 1),
  ]
}

const updateCached = (cached, query) =>
  isCached(cached, query) && isExpired(cached, query)
    ? [
        ...updateTimestamoOfExpired(cached, query),
      ]
    : [
        ...cached,
        {value: query, timestamp: Date.now()}
      ].filter(uniq)

/* request information */

const calculateRequestDuration = (t0) =>
  (performance.now() - t0).toFixed(2)

const calculateRequestInfo = (t0) =>
  ({
    ms: calculateRequestDuration(t0).toString(),
  })

/* state updates */

const getUpdatedState = (hits, query, t0) => ({ cached }) =>
  ({
    hits,
    reqInfo: calculateRequestInfo(t0),
    cached: updateCached(cached, query),
    wasCached: updateWasCached(cached, query),
  })

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      hits: [],
      reqInfo: null,
      cached: [],
      wasCached: false,
    };
  }

  onSearch = (e, query) => {
    e.preventDefault();

    if (query == '') {
      return;
    }

    const t0 = performance.now();

    api.hackernews.getList(query)
      .then(({ hits }) => {
        this.setState(getUpdatedState(hits, query, t0));
      });
  }

  onNukeCacheAll = () => {
    api.fakeNukeCache.nuke()
      .then(() => this.setState({ cached: [] }));
  }

  render() {
    const {
      hits,
      reqInfo,
      cached,
      wasCached,
    } = this.state;

    return (
      <Page>
        <Header>
          <h1>Search Hacker News with Ladda</h1>
          <Search
            onSearch={this.onSearch}
          />
          <SearchInformationWithMaybe
            reqInfo={reqInfo}
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
              onNukeCacheAll={this.onNukeCacheAll}
            />
          </SideContent>
        </Content>
        <LaddaInformation />
      </Page>
    );
  }
}

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
  reqInfo,
  cached,
  wasCached,
}) =>
  <div>
    <MsLabel
      ms={reqInfo.ms}
      wasCached={wasCached}
    />
    <CacheLabel
      cached={cached}
    />
  </div>

const Cache = ({
  cached,
  onNukeCacheAll,
}) =>
  <div>
    <div className="interactions" style={{ marginBottom: '20px' }}>
      <Button
        onClick={onNukeCacheAll}
      >
        Nuke Cache
      </Button>
    </div>
    <CacheList
      cached={cached}
    />
  </div>

const CacheList = ({
  cached,
}) =>
  <div className="table">
    {cached.map(item =>
      <CacheItem
        key={item.value}
        item={item}
      />
    )}
  </div>

class CacheItem extends Component {

  constructor(props) {
    super(props);

    this.state = {
      remaining: getRemainingToTtl(props.item.timestamp)
    }
  }

  componentDidMount() {
    this.interval = setInterval(this.tick, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick = () => {
    const remaining = getRemainingToTtl(this.props.item.timestamp);
    remaining <= 0
      ? this.setState({ remaining: 0 })
      : this.setState({ remaining });
  }

  render() {
    const { value } = this.props.item;
    const { remaining } = this.state;
    const isExpired = remaining <= 0;

    return (
      <div className="table-row" style={getSignalBackgroundColor(!isExpired)}>
        <div style={{ width: '50%' }}>
          {value}
        </div>
        <div style={{ width: '50%' }}>
          {isExpired ? 'expired' : <span>TTL: {remaining} s</span> }
        </div>
      </div>
    );
  }
}

const MsLabel = ({
  ms,
  wasCached,
}) =>
  <p style={getSignalTextColor(wasCached)}>
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
    All Cached Requests: <strong>{cached.map(getValues).join(', ' )}</strong>
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

const LaddaInformation = () =>
  <div style={{display: 'flex', justifyContent: 'center' }}>
    <div style={{margin: '20px'}}>
      <h2>No Ladda</h2>
      <Highlight className="js">
          { "\n" + getList.toString() }
      </Highlight>
    </div>
    <div style={{margin: '20px'}}>
      <h2>Ladda</h2>
      <Highlight className="js">
          {
            "const getList.operation = 'READ';" +
            "\n" +
            getList.toString() +
            "\n" +
            "\n" +
            "const config = {" + "\n" +
            " hackernews: {" + "\n" +
            "  ttl: 15," + "\n" +
            "  api: { getList }" + "\n" +
            " }" + "\n" +
            "};" + "\n" +
            "\n" +
            "const api = build(config);"
          }
      </Highlight>
    </div>
  </div>

const withMaybe = (Component, key) => (props) =>
  props[key] && props[key].length
    ? <Component {...props} />
    : null

const HitsListWithMaybe = withMaybe(HitsList, 'list');
const SearchInformationWithMaybe = withMaybe(SearchInformation, 'cached');
const CacheWithMaybe = withMaybe(Cache, 'cached');

const withClassNameContainer = (className) => ({ children }) =>
  <div className={className}>{children}</div>

const Page = withClassNameContainer("page");
const Header = withClassNameContainer("page-header");
const Content = withClassNameContainer("page-content");
const MainContent = withClassNameContainer("page-content-main");
const SideContent = withClassNameContainer("page-content-side");

export default App;
