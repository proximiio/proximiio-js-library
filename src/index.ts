import Auth from './controllers/auth';
import Places from './controllers/places';
import Floors from './controllers/floors';
import Kiosks from './controllers/kiosks';
import Ads from './controllers/ads';
import { Map } from './components/map/main';
import { Select } from './components/select/main';
import SelectLogger from './components/logger/select';
import SearchLogger from './components/logger/search';
import { ImageDetection } from './components/imageDetection/main';

export default {
  Auth,
  Places,
  Floors,
  Kiosks,
  Ads,
  Map,
  Select,
  SelectLogger,
  SearchLogger,
};

export { ImageDetection };
