const Proximiio = require('../../lib/index').default;

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
  })
  .catch(err => {
    console.log(err);
  });
