import React, { Component } from 'react';
import { fetchList } from '../api';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { hits: null };
  }

  getList = (query) => {
    fetchList(query)
      .then(({ hits }) => this.setState({ hits }));
  }

  render() {
    const { hits } = this.state;

    return (
      <div>
        <button type="button" onClick={() => this.getList('react')}>Fetch React</button>
        <button type="button" onClick={() => this.getList('redux')}>Fetch Redux</button>
        {hits && hits.map(item => <div key={item.objectID}>{item.title}</div>)}
      </div>
    );
  }
}

export default App;
