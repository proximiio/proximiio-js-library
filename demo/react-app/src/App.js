import logo from './logo.svg';
import './App.css';
import React from 'react';
import Proximiio from 'proximiio-js-library/lib/index'

class App extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    Proximiio.Auth.login('devs@proximi.io', 'pr0x1m33')
      .then(res => {
        console.log('Logged in', res);

        Proximiio.Places.getPlaces(5)
        .then(res => {
          console.log('places fetched', res);
        })
        .catch(err => {
          console.log(err);
        })

        Proximiio.Floors.getFloors(5)
        .then(res => {
          console.log('floors fetched', res);
        })
        .catch(err => {
          console.log(err);
        })

        const map = new Proximiio.Map();

        map.getMapReadyListener().subscribe(res => {
          console.log('map ready', res);
        });

        const placeSelect = new Proximiio.Select('Places', { placeHolder: 'Pick the place', highlight: true, selector: '#place-select' });
        placeSelect.getSelectListener().subscribe(place => {
          map.setPlace(place.id);
          console.log('place selected', place);
        })

        const floorSelect = new Proximiio.Select('Floors', { placeHolder: 'Pick the floor', highlight: true, selector: '#floor-select' });
        floorSelect.getSelectListener().subscribe(floor => {
          map.setFloorById(floor.id);
          console.log('floor selected', floor);
        })

        let fromPoi = null;
        let toPoi = null;

        const fromPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the start poi', highlight: true, selector: '#from-poi-select' });
        fromPoiSelect.getSelectListener().subscribe(poi => {
          fromPoi = poi;
          map.centerToFeature(poi.id);
          console.log('from poi selected', poi);
          if (fromPoi && toPoi) {
            map.findRouteByIds(fromPoi.id, toPoi.id);
          }
        })

        const toPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the end poi', highlight: true, selector: '#to-poi-select' });
        toPoiSelect.getSelectListener().subscribe(poi => {
          toPoi = poi;
          map.centerToFeature(poi.id);
          console.log('to poi selected', poi);
          if (fromPoi && toPoi) {
            console.log()
            map.findRouteByIds(fromPoi.id, toPoi.id);
          }
        })
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <div className="autoComplete_wrapper">
            <input id="place-select" className="proximiio-select" type="text" tabIndex="1"/>
            <input id="floor-select" className="proximiio-select" type="text" tabIndex="1"/>
            <input id="from-poi-select" className="proximiio-select" type="text" tabIndex="1"/>
            <input id="to-poi-select" className="proximiio-select" type="text" tabIndex="1"/>
          </div>
        </header>
        <div id="proximiioMap"></div>
      </div>
    );
  }

}

export default App;
