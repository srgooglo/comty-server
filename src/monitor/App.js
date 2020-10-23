import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import Monitor from "./Monitor";

class App extends Component {
    render() {
        return (
            <Router>
                <Route path="/" exact component={Monitor} />
            </Router>
        )
    }
}

export default App;