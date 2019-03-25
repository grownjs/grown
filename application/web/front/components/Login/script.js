import { store, query, mutation } from '../../shared/store';
import { ME_INFO, LOGIN_REQUEST, LOGOUT_REQUEST } from '../../shared/queries';

export default {
  components: {
    Catch: '../Catch',
    Password: '../Password',
    PasswordRecovery: '../PasswordRecovery',
  },
  data() {
    return {
      email: null,
      password: null,
    };
  },
  oncreate() {
    store.on('state', ({ changed, current }) => {
      if (changed.loggedIn && current.loggedIn) {
        localStorage.setItem('session', JSON.stringify(current.login));
        location.reload();
      } else if (changed.info && !current.loading) {
        store.set({
          loggedIn: true,
        });
      }
    });

    store.set({
      info: query(ME_INFO),
    });
  },
  methods: {
    cancel(e) {
      e.preventDefault();
    },
    doLogin: mutation(LOGIN_REQUEST, commit => function login$() {
      const { email, password } = this.get();

      store.set({
        login: commit({ email, password }, () => {
          store.set({ loggedIn: true });
        }),
      });
    }),
    doLogout: mutation(LOGOUT_REQUEST, commit => function logout$(e) {
      e.target.disabled = true;

      store.set({
        logout: commit(() => {
          localStorage.clear();
          location.reload();
        }),
      });
    }),
  },
};
