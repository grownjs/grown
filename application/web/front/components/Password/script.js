import { mutation } from '../../shared/store';
import { UPDATE_PASSWORD_REQUEST } from '../../shared/queries';

export default {
  components: {
    Catch: '../Catch',
  },
  data() {
    return {
      password: null,
      newPassword: null,
      confirmPassword: null,
    };
  },
  methods: {
    cancel(e) {
      e.preventDefault();
    },
    closeMe(e) {
      e.preventDefault();

      this.set({
        editing: false,
        password: null,
        newPassword: null,
        confirmPassword: null,
      });
    },
    changeMe(e) {
      e.preventDefault();

      this.set({
        editing: true,
      });
    },
    doUpdate: mutation(UPDATE_PASSWORD_REQUEST, commit => function update$() {
      const { password, newPassword, confirmPassword } = this.get();

      const payload = {
        oldPassword: password,
        newPassword,
        confirmPassword,
      };

      this.store.set({
        update: commit(payload, () => {
          this.set({
            editing: false,
          });
        }),
      });
    }),
  },
};
