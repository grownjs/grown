// import { mutation } from '../../shared/store';
// import { RECOVER_PASSWORD_REQUEST } from '../../shared/queries';

// export default {
//   components: {
//     Catch: '../Catch',
//   },
//   data() {
//     return {
//       email: null,
//     };
//   },
//   methods: {
//     cancel(e) {
//       e.preventDefault();
//     },
//     closeMe(e) {
//       e.preventDefault();

//       this.set({
//         editing: false,
//       });
//     },
//     changeMe(e) {
//       e.preventDefault();

//       this.set({
//         editing: true,
//       });
//     },
//     doUpdate: mutation(RECOVER_PASSWORD_REQUEST, commit => function update$() {
//       const { email } = this.get();

//       const payload = {
//         email,
//       };

//       this.store.set({
//         update: commit(payload, () => {
//           this.set({
//             editing: false,
//           });
//         }),
//       });
//     }),
//   },
// };
