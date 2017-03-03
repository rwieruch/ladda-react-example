const BASE_URL = 'https://hn.algolia.com/api/v1/';

getList.idFrom = 'ARGS';
getList.operation = 'READ';
function getList(query) {
  const url = `${BASE_URL}search?query=${query}&hitsPerPage=200`;
  return fetch(url)
    .then(response => response.json());
}

export {
  getList,
}