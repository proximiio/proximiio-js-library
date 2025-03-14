import Auth from './controllers/auth';
import Places from './controllers/places';
import Floors from './controllers/floors';
import Kiosks from './controllers/kiosks';
import Ads from './controllers/ads';
import Geo from './controllers/geo';
import { Map } from './components/map/main';
import { Select } from './components/select/main';
import SelectLogger from './components/logger/select';
import SearchLogger from './components/logger/search';
import { ImageDetection } from './components/imageDetection/main';
import InteractionLogger from './components/logger/interaction';
import StoreFeedback from './components/feedback/store';
import VisitorFeedback from './components/feedback/visitor';

export default {
  Auth,
  Places,
  Floors,
  Kiosks,
  Ads,
  Geo,
  Map,
  Select,
  SelectLogger,
  SearchLogger,
  InteractionLogger,
  StoreFeedback,
  VisitorFeedback,
};

export { ImageDetection };
