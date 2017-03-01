import { build } from 'ladda-cache';
import * as hackernews from './hackernews';
import * as fakeNukeCache from './fakeNukeCache';

const config = {
  hackernews: {
    ttl: 60,
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