import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './swal.css';

export const AppSwal = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: 'app-swal-popup',
    title: 'app-swal-title',
    htmlContainer: 'app-swal-content',
    actions: 'app-swal-actions',
    confirmButton: 'app-swal-confirm',
    cancelButton: 'app-swal-cancel',
  },
});