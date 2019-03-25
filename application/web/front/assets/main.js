import App from '../components/App';
import { store } from '../shared/store';

new App({ // eslint-disable-line
  target: document.querySelector('#app'),
  store,
});
