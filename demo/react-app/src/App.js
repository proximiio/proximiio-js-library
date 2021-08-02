import logo from './logo.svg';
import './App.css';
import React from 'react';
import Proximiio from 'proximiio-js-library'
import * as turf from '@turf/turf';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.map = {};
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

        this.map = new Proximiio.Map({
          allowNewFeatureModal: true,
          zoomIntoPlace: false,
          isKiosk: true,
          kioskSettings: {
            coordinates: [17.833135351538658, 48.60678469647394],
            level: 0
          }
          /*mapboxOptions: {
            center: [17.833135351538658, 48.60678469647394],
            zoom: 20
          }*/
        });

        this.map.getMapReadyListener().subscribe(async (res) => {
          console.log('map ready', res);

          let bounds = this.map.getMapboxInstance().getBounds();
          for (let poi of customPoiList) {
            const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
            this.map.addCustomFeature(poi.title, poi.level, position[1], position[0], '', poi.id);
          }

          setInterval(() => {
            for (let poi of customPoiList) {
              const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
              this.map.updateFeature(poi.id, poi.title, poi.level, position[1], position[0]);
            }
          }, 5000);

          setTimeout(() => {
            this.map.setKiosk(48.60615461642394, 17.833135351598658, 0)
          }, 3000)
        });

        this.map.getFeatureAddListener().subscribe(feature => {
          console.log('feature added ', feature);
        })

         this.map.getFeatureDeleteListener().subscribe(() => {
          console.log('feature deleted ');
        })

        const placeSelect = new Proximiio.Select('Places', { placeHolder: 'Pick the place', resultItem: { highlight: { render: true } }, selector: '#place-select' });
        placeSelect.getSelectListener().subscribe(place => {
          this.map.setPlace(place.id);
          console.log('place selected', place);
        })

        const floorSelect = new Proximiio.Select('Floors', { placeHolder: 'Pick the floor', resultItem: { highlight: { render: true } }, selector: '#floor-select' });
        floorSelect.getSelectListener().subscribe(floor => {
          this.map.setFloorById(floor.id);
          console.log('floor selected', floor);
        })

        let fromPoi = null;
        let toPoi = null;

        const fromPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the start poi', resultItem: { highlight: { render: true } }, selector: '#from-poi-select' });
        fromPoiSelect.getSelectListener().subscribe(poi => {
          fromPoi = poi;
          this.map.centerToFeature(poi.id);
          console.log('from poi selected', poi);
          if (fromPoi && toPoi) {
            this.map.findRouteByIds(toPoi.id, fromPoi.id);
          }
        })

        const toPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the end poi', resultItem: { highlight: { render: true } }, selector: '#to-poi-select' });
        toPoiSelect.getSelectListener().subscribe(poi => {
          toPoi = poi;
          this.map.centerToFeature(poi.id);
          console.log('to poi selected', poi);
          if (toPoi) {
            this.map.findRouteByIds(toPoi.id);
          }
        })

        this.map.getRouteFoundListener().subscribe(res => {
          console.log('route found successfully', res.route);
          console.log('turn by turn text navigation output', res.TBTNav);
        })
      })
      .catch(err => {
        console.log(err);
      });
  }

  onFloorUp = () => {
    this.map.setFloorByWay('up');
  }

  onFloorDown = () => {
    this.map.setFloorByWay('down');
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
          <button onClick={this.onFloorUp}>Floor Up</button>
          <button onClick={this.onFloorDown}>Floor Down</button>
        </header>
        <div id="proximiioMap"></div>
      </div>
    );
  }

}

export default App;
