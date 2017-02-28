import { build } from 'ladda-cache';

getList.operation = 'READ';
function getList(query) {
  return fetch(`https://hn.algolia.com/api/v1/search?query=${query}&hitsPerPage=200`)
    .then(response => response.json());
}

const config = {
  hackernews: {
    ttl: 300,
    api: { getList }
  }
};

const api = build(config);

export default api;