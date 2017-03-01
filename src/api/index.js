import { build } from 'ladda-cache';
import * as hackernews from './hackernews';
import * as fakeNukeCache from './fakeNukeCache';

const TTL = 15;

const config = {
  hackernews: {
    ttl: TTL,
    api: hackernews
  },
  fakeNukeCache: {
    invalidates: ['hackernews(*)'],
    invalidatesOn: ['DELETE'],
    api: fakeNukeCache
  },
};

const api = build(config);

export default api;

export {
  TTL,
}