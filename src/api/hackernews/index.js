getList.operation = 'READ';
function getList(query) {
  return fetch(`https://hn.algolia.com/api/v1/search?query=${query}&hitsPerPage=200`)
    .then(response => response.json());
}

export {
  getList,
}