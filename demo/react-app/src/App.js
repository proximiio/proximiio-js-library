import logo from './logo.svg';
import './App.css';
import React from 'react';
import Proximiio from 'proximiio-js-library'
import * as turf from '@turf/turf';

class App extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const customPoiList = [{
      id: 'custom-poi-1',
      title: 'Custom Poi',
      level: 0
    }, {
      id: 'custom-poi-2',
      title: 'Custom Poi 2',
      level: 0
    }, {
      id: 'custom-poi-3',
      title: 'Custom Poi 3',
      level: 0
    }, {
      id: 'custom-poi-4',
      title: 'Custom Poi 4',
      level: 0
    }, {
      id: 'custom-poi-5',
      title: 'Custom Poi 5',
      level: 0
    }];

    Proximiio.Auth.login('email', 'password')
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

        const map = new Proximiio.Map({
          allowNewFeatureModal: true
        });

        map.getMapReadyListener().subscribe(async (res) => {
          console.log('map ready', res);

          let bounds = map.getMapboxInstance().getBounds();
          for (let poi of customPoiList) {
            const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
            map.addCustomFeature(poi.title, poi.level, position[1], position[0], '', poi.id);
          }

          setInterval(() => {
            for (let poi of customPoiList) {
              const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
              map.updateFeature(poi.id, poi.title, poi.level, position[1], position[0]);
            }
          }, 5000);
        });

        map.getFeatureAddListener().subscribe(feature => {
          console.log('feature added ', feature);
        })

         map.getFeatureDeleteListener().subscribe(() => {
          console.log('feature deleted ');
        })

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
            map.findRouteByIds(fromPoi.id, toPoi.id);
          }
        })

        map.getRouteFoundListener().subscribe(res => {
          console.log('route found successfully', res.route);
          console.log('turn by turn text navigation output', res.TBTNav);
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
