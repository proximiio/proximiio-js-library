import logo from './logo.svg';
import './App.css';
import React from 'react';
import Proximiio from 'proximiio-js-library'
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.map = {};
  }

  componentDidMount() {
    Proximiio.Auth.loginWithToken('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImlzcyI6IjQ0MDEwZjZmLTk5NjMtNDQzMy1hZDg2LTQwYjg5YjgyOWM0MSIsInR5cGUiOiJ1c2VyIiwidXNlciI6IkRlbW8gV2F5ZmluZGluZyIsInVzZXJfaWQiOiI1ZTBkNDVlMy0wMjVmLTRiMzItYmUwNy0wYzk0MjUxYmQ1NzMiLCJ0ZW5hbnRfaWQiOiI0NDAxMGY2Zi05OTYzLTQ0MzMtYWQ4Ni00MGI4OWI4MjljNDEifQ.reaAdK4uUqvGcDghQTmXtbsHR4mX9Hcinwwg4_uqwfQ')
      .then(res => {
        console.log('Logged in', res);

        this.map = new Proximiio.Map({
          allowNewFeatureModal: false,
          zoomIntoPlace: false,
          isKiosk: true,
          kioskSettings: {
            coordinates: [51.48091652702158, 25.336680584406395],
            level: 0
          },
          mapboxOptions: {
            zoom: 20,
            bearing: 10,
            pitch: 40
          },
          initPolygons: true
        });

        this.map.getMapReadyListener().subscribe(async (res) => {
          console.log('map ready', res);
          this.map.getMapboxInstance().addControl(new mapboxgl.NavigationControl());
        });

        this.map.getPolygonClickListener().subscribe(poi => {
          this.map.findRouteByIds(poi.id, null);
        });

        this.map.getRouteFoundListener().subscribe(res => {
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
        <div id="proximiioMap"></div>
      </div>
    );
  }

}

export default App;
