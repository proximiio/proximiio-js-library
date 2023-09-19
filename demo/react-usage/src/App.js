import logo from './logo.svg';
import './App.css';
import React from 'react';
import Proximiio from 'proximiio-js-library';
import maplibregl from 'maplibre-gl';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.map = {};
  }

  componentDidMount() {
    const customPoiList = [
      {
        id: 'custom-poi-1',
        title: 'Custom Poi',
        level: 0,
      },
      {
        id: 'custom-poi-2',
        title: 'Custom Poi 2',
        level: 0,
      },
      {
        id: 'custom-poi-3',
        title: 'Custom Poi 3',
        level: 0,
      },
      {
        id: 'custom-poi-4',
        title: 'Custom Poi 4',
        level: 0,
      },
      {
        id: 'custom-poi-5',
        title: 'Custom Poi 5',
        level: 0,
      },
    ];

    Proximiio.Auth.loginWithToken('token')
      .then((res) => {
        console.log('Logged in', res);

        Proximiio.Places.getPlaces(5)
          .then((res) => {
            console.log('places fetched', res);
          })
          .catch((err) => {
            console.log(err);
          });

        Proximiio.Floors.getFloors(5)
          .then((res) => {
            console.log('floors fetched', res);
          })
          .catch((err) => {
            console.log(err);
          });

        this.map = new Proximiio.Map({
          allowNewFeatureModal: false,
          zoomIntoPlace: false,
          /*isKiosk: true,
          kioskSettings: {
            coordinates: [51.48091652702158, 25.336680584406395],
            level: 0
          },*/
          mapboxOptions: {
            zoom: 20,
            bearing: 10,
            pitch: 40,
          },
          initPolygons: true,
          // defaultPlaceId: 'default place id',
          showLevelDirectionIcon: true,
          animatedRoute: true,
          useTimerangeData: true
        });

        this.map.getMapReadyListener().subscribe(async (res) => {
          console.log('map ready', res);

          this.map.getMapboxInstance().addControl(new maplibregl.NavigationControl());

          this.map.setAmenitiesCategory('shop', [
            '44010f6f-9963-4433-ad86-40b89b829c41:c693d414-4613-4c6c-95da-771e52759873',
            '44010f6f-9963-4433-ad86-40b89b829c41:d111c5e4-1a63-48b3-94de-5fa7b309daaf',
            '44010f6f-9963-4433-ad86-40b89b829c41:da5435e2-9179-4ca6-86e4-652b7e8d109b',
            '44010f6f-9963-4433-ad86-40b89b829c41:c96e80d7-6683-4ca0-bc64-b6ed3fc824e2',
            '44010f6f-9963-4433-ad86-40b89b829c41:f62dd757-4057-4015-97a0-c66d8934f7d8',
          ]);

          this.map.setAmenitiesCategory('amenities', [
            '44010f6f-9963-4433-ad86-40b89b829c41:e762ea14-70e2-49b7-9938-f6870f9ab18f',
            '44010f6f-9963-4433-ad86-40b89b829c41:61042c8a-87a3-40e4-afa8-3a2c3c09fbf8',
            '44010f6f-9963-4433-ad86-40b89b829c41:62c605cc-75c0-449a-987c-3bdfef2c1642',
            '44010f6f-9963-4433-ad86-40b89b829c41:57ef933b-ff2e-4db1-bc99-d21f2053abb2',
            '44010f6f-9963-4433-ad86-40b89b829c41:2cd016a5-8703-417c-af07-d49aef074ad3',
          ]);

          /*let bounds = this.map.getMapboxInstance().getBounds();
          for (let poi of customPoiList) {
            const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
            this.map.addCustomFeature(poi.title, poi.level, position[1], position[0], '', poi.id);
          }

          setInterval(() => {
            for (let poi of customPoiList) {
              const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);
              this.map.updateFeature(poi.id, poi.title, poi.level, position[1], position[0]);
            }
          }, 5000);*/
        });

        this.map.getPersonUpdateListener().subscribe((res) => {
          console.log('persons update', res);
        });

        this.map.getFeatureAddListener().subscribe((feature) => {
          console.log('feature added ', feature);
        });

        this.map.getFeatureDeleteListener().subscribe(() => {
          console.log('feature deleted ');
        });

        const placeSelect = new Proximiio.Select('Places', {
          placeHolder: 'Pick the place',
          resultItem: { highlight: { render: true } },
          selector: '#place-select',
        });
        placeSelect.getSelectListener().subscribe((place) => {
          this.map.setPlace(place.id);
          console.log('place selected', place);
        });

        const floorSelect = new Proximiio.Select('Floors', {
          placeHolder: 'Pick the floor',
          resultItem: { highlight: { render: true } },
          selector: '#floor-select',
        });
        floorSelect.getSelectListener().subscribe((floor) => {
          this.map.setFloorById(floor.id);
          console.log('floor selected', floor);
        });

        let fromPoi = null;
        let toPoi = null;

        const fromPoiSelect = new Proximiio.Select('Pois', {
          placeHolder: 'Pick the start poi',
          resultItem: { highlight: { render: true } },
          selector: '#from-poi-select',
        });
        fromPoiSelect.getSelectListener().subscribe((poi) => {
          fromPoi = poi;
          this.map.centerToFeature(poi.id);
          console.log('from poi selected', poi);
          if (fromPoi && toPoi) {
            this.map.findRouteByIds(toPoi.id, fromPoi.id);
          }
        });

        const toPoiSelect = new Proximiio.Select('Pois', {
          placeHolder: 'Pick the end poi',
          resultItem: { highlight: { render: true } },
          selector: '#to-poi-select',
        });
        toPoiSelect.getSelectListener().subscribe((poi) => {
          toPoi = poi;
          this.map.centerToFeature(poi.id);
          console.log('to poi selected', poi);
          if (fromPoi && toPoi) {
            this.map.findRouteByIds(toPoi.id, fromPoi.id);
          }
        });

        this.map.getRouteFoundListener().subscribe((res) => {
          console.log('route found successfully', res.route);
          console.log('turn by turn text navigation output', res.TBTNav);
        });

        this.map.getPolygonClickListener().subscribe((poi) => {
          this.map.findRouteByIds(poi.id, null);
        });

        this.map.getNavStepSetListener().subscribe((step) => {
          console.log('nav step changed', step);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  onFloorUp = () => {
    this.map.setFloorByWay('up');
  };

  onFloorDown = () => {
    this.map.setFloorByWay('down');
  };

  onSetFeatureFilter = (feature) => {
    this.map.setFeatureFilter(feature);
  };

  onRemoveFeatureFilter = (feature) => {
    this.map.removeFeatureFilter(feature);
  };

  onSetFilter = (amenityId, category) => {
    this.map.setAmenityFilter(amenityId, category);
  };

  onRemoveFilter = (amenityId, category) => {
    this.map.removeAmenityFilter(amenityId, category);
  };

  onResetFilters = () => {
    this.map.resetAmenityFilters();
  };

  onResetFeatureFilters = () => {
    this.map.resetFeatureFilters();
  };

  onToggleHiddenPois = () => {
    this.map.toggleHiddenPois();
  };

  onNextStep = () => {
    this.map.setNavStep('next');
  };

  onPrevStep = () => {
    this.map.setNavStep('previous');
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          <div className="autoComplete_wrapper">
            <input id="place-select" className="proximiio-select" type="text" tabIndex="1" />
            <input id="floor-select" className="proximiio-select" type="text" tabIndex="1" />
            <input id="from-poi-select" className="proximiio-select" type="text" tabIndex="1" />
            <input id="to-poi-select" className="proximiio-select" type="text" tabIndex="1" />
          </div>
          <button onClick={this.onFloorUp}>Floor Up</button>
          <button onClick={this.onFloorDown}>Floor Down</button>
          <button onClick={this.onSetFeatureFilter.bind(this, 'P.D. .')}>Set P.D. Filter</button>
          <button onClick={this.onRemoveFeatureFilter.bind(this, 'P.D. .')}>Remove P.D. Filter</button>
          <button onClick={this.onSetFeatureFilter.bind(this, 'Olive Grove')}>Set Olive Grove Filter</button>
          <button onClick={this.onRemoveFeatureFilter.bind(this, 'Olive Grove')}>Remove Olive Grove Filter</button>
          <button
            onClick={this.onSetFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:c693d414-4613-4c6c-95da-771e52759873',
              'shop',
            )}
          >
            Set Cafe Filter
          </button>
          <button
            onClick={this.onSetFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:d111c5e4-1a63-48b3-94de-5fa7b309daaf',
              'shop',
            )}
          >
            Set Clothing Filter
          </button>
          <button
            onClick={this.onSetFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:e762ea14-70e2-49b7-9938-f6870f9ab18f',
              'amenities',
            )}
          >
            Set Toilets Filter
          </button>
          <button
            onClick={this.onRemoveFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:c693d414-4613-4c6c-95da-771e52759873',
              'shop',
            )}
          >
            Remove Cafe Filter
          </button>
          <button
            onClick={this.onRemoveFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:d111c5e4-1a63-48b3-94de-5fa7b309daaf',
              'shop',
            )}
          >
            Remove Clothing Filter
          </button>
          <button
            onClick={this.onRemoveFilter.bind(
              this,
              '44010f6f-9963-4433-ad86-40b89b829c41:e762ea14-70e2-49b7-9938-f6870f9ab18f',
              'amenities',
            )}
          >
            Remove Toilets Filter
          </button>
          <button onClick={this.onResetFilters}>Reset Filters</button>
          <button onClick={this.onResetFeatureFilters}>Reset Feature Filters</button>
          <button onClick={this.onResetFeatureFilters}>Reset Feature Filters</button>
          <button onClick={this.onToggleHiddenPois}>Toggle Hidden Pois</button>
          <button onClick={this.onNextStep}>Next Step</button>
          <button onClick={this.onPrevStep}>Previous Step</button>
        </header>
        <div id="proximiioMap"></div>
      </div>
    );
  }
}

export default App;
