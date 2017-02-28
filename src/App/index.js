import React, { Component } from 'react';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { hits: null };
  }

  getList = (query) => {
    fetch(`https://hn.algolia.com/api/v1/search?query=${query}&hitsPerPage=200`)
      .then(response => response.json())
      .then(({ hits }) => this.setState({ hits }));
  }

  render() {
    const { hits } = this.state;

    return (
      <div>
        <button type="button" onClick={() => this.getList('react')}>Fetch React</button>
        <button type="button" onClick={() => this.getList('redux')}>Fetch Redux</button>
        {
          hits
            ? hits.map(item => <div key={item.objectID}>{item.title}</div>)
            : null
        }
      </div>
    );
  }
}

export default App;
