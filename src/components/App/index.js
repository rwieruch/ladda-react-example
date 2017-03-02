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
  timestamp <= Date.now() - toMs(TTL)

/* util */

const getValues = ({ value }) =>
  value

const uniq = ({ value }, i, self) =>
  self.map(getValues).indexOf(value) === i

const sum = (a, b) =>
  a + b;

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

const isCacheHit = (v) =>
  v.isCacheHit

const isNotCacheHit = (v) =>
  !v.isCacheHit

const getMs = (v) =>
  +v.ms

const calculateRequestTimeSaved = (requestSummary) => {
  const cacheMisses = requestSummary.filter(isNotCacheHit);
  const cacheMissesMs = cacheMisses.map(getMs);
  const cacheMissesMsAvg = cacheMissesMs.reduce(sum) / cacheMisses.length;

  const cacheHits = requestSummary.filter(isCacheHit);
  const cacheHitsMs = cacheHits.map(getMs);
  const cacheHitsMsAvg = cacheHitsMs.reduce(sum) / cacheHits.length;

  return ((cacheMissesMsAvg - cacheHitsMsAvg) * cacheHits.length / 1000).toFixed(2);
}

const calculateRequestDuration = (t0) =>
  (performance.now() - t0).toFixed(2)

const calculateRequestInfo = (t0, cached, query) =>
  ({
    value: query,
    ms: calculateRequestDuration(t0).toString(),
    isCacheHit: updateWasCached(cached, query),
  })

const updateRequestInfo = (requestSummary, t0, cached, query) =>
  [
    ...requestSummary,
    calculateRequestInfo(t0, cached, query)
  ]

/* state updates */

const getUpdatedState = (hits, query, t0) => ({ requestSummary, cached }) =>
  ({
    hits,
    requestSummary: updateRequestInfo(requestSummary, t0, cached, query),
    cached: updateCached(cached, query),
    wasCached: updateWasCached(cached, query),
    isLoading: false,
  })

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      hits: [],
      requestSummary: [],
      cached: [],
      wasCached: false,
    };
  }

  onSearch = (e, query) => {
    e.preventDefault();

    if (query == '') {
      return;
    }

    this.setState({ isLoading: true });
    const t0 = performance.now();

    api.hackernews.getList(query)
      .then(({ hits }) => {
        this.setState(getUpdatedState(hits, query, t0));
      });
  }

  onNukeCacheAll = () => {
    api.fakeNukeCache.nuke()
      .then(() => this.setState({
        cached: [],
        requestSummary: []
      }));
  }

  render() {
    const {
      hits,
      requestSummary,
      cached,
      wasCached,
      isLoading,
    } = this.state;

    return (
      <Page>
        <Header>
          <h1>Search Hacker News with Ladda</h1>
          <Search
            isDisabled={isLoading}
            onSearch={this.onSearch}
          />
          <SearchInformationWithMaybeWithLoading
            cached={cached}
            isLoading={isLoading}
            wasCached={wasCached}
            requestSummary={requestSummary[requestSummary.length - 1]}
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
            <RequestSummaryWithMaybe
              requestSummary={requestSummary}
            />
          </SideContent>
        </Content>
        <LaddaInformation />
      </Page>
    );
  }
}

const RequestSummary = ({
  requestSummary,
}) =>
  <div>
    <h3>Requests Summary</h3>
    {
      requestSummary.filter(v => v.isCacheHit).length > 0 &&
      <RequestSummaryDescription
        requestSummary={requestSummary}
      />
    }
    <div className="table">
      {requestSummary.map(item => <RequestInfoItem key={item.ms} item={item} />)}
    </div>
  </div>

const RequestSummaryDescription = ({
  requestSummary,
}) =>
  <ul style={{margin: '10px 0' }}>
    <li>
      <small>
        <strong>{requestSummary.filter(v => v.isCacheHit).length}</strong> of {requestSummary.length} searches hit the cache
      </small>
    </li>
    <li>
      <small>
        <strong>{calculateRequestTimeSaved(requestSummary)}</strong> seconds in average were saved due cache
      </small>
    </li>
  </ul>

const RequestInfoItem = ({
  item,
}) =>
  <div className="table-row" style={getSignalBackgroundColor(item.isCacheHit)}>
    <div style={{ width: '50%' }}>
      {item.value}
    </div>
    <div style={{ width: '50%' }}>
      {item.ms} ms
    </div>
  </div>

const HitsList = ({
  list,
}) =>
  <div>
    <h3>Search Result</h3>
    <div className="table">
      {list.map(item => <HitItem key={item.objectID} item={item} />)}
    </div>
  </div>

const HitItem = ({
  item,
}) =>
  <div className="table-row">
    {item.title}
  </div>

const Search = ({
  isDisabled,
  onSearch,
}) => {
  let input;

  return (
    <form
      className="interactions"
      onSubmit={(e) => onSearch(e, input.value.toLowerCase())}
    >
      <input ref={node => input = node} />
      <Button
        isDisabled={isDisabled}
        type="submit"
      >
        Search
      </Button>
    </form>
  );
}

const SearchInformation = ({
  requestSummary,
  wasCached,
}) =>
  <div>
    <MsLabel
      ms={requestSummary.ms}
      wasCached={wasCached}
    />
  </div>

const Cache = ({
  cached,
  onNukeCacheAll,
}) =>
  <div>
    <h3>Cache</h3>
    <CacheList
      cached={cached}
    />
    <div className="interactions">
      <Button
        onClick={onNukeCacheAll}
      >
        Nuke Cache
      </Button>
    </div>
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

const Button = ({
  type = 'button',
  onClick = () => {},
  isDisabled = false,
  children,
}) =>
  <button
    disabled={isDisabled}
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
          {
            "const BASE_URL = 'https://hn.algolia.com/api/v1/';" +
            "\n\n\n\n" +
            getList.toString()
          }
      </Highlight>
    </div>
    <div style={{margin: '20px'}}>
      <h2>Ladda</h2>
      <Highlight className="js">
          {
            "const BASE_URL = 'https://hn.algolia.com/api/v1/';" +
            "\n\n" +
            "getList.idFrom = v => v.objectID" +
            "\n" +
            "const getList.operation = 'READ';" +
            "\n" +
            getList.toString()
          }
      </Highlight>
    </div>
  </div>

const withMaybe = (Component, key) => (props) =>
  props[key] && props[key].length
    ? <Component {...props} />
    : null

const HitsListWithMaybe = withMaybe(HitsList, 'list');
const CacheWithMaybe = withMaybe(Cache, 'cached');
const RequestSummaryWithMaybe = withMaybe(RequestSummary, 'requestSummary');

const withClassNameContainer = (className) => ({ children }) =>
  <div className={className}>{children}</div>

const Page = withClassNameContainer("page");
const Header = withClassNameContainer("page-header");
const Content = withClassNameContainer("page-content");
const MainContent = withClassNameContainer("page-content-main");
const SideContent = withClassNameContainer("page-content-side");

const withLoading = (Component) => ({ isLoading, ...r }) =>
  isLoading ? <p>Loading ...</p> : <Component { ...r } />

const SearchInformationWithMaybe = withMaybe(SearchInformation, 'cached');
const SearchInformationWithMaybeWithLoading = withLoading(SearchInformationWithMaybe);

export default App;
