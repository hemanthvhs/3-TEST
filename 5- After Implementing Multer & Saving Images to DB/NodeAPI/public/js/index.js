/* eslint-disable */
import 'regenerator-runtime/runtime';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';

// On Login Form Listen For Submit Event
// Get the email & password entered by the user

const loginFormEl = document.querySelector('.form--login');
const mapboxEl = document.getElementById('map');
const logoutBtnEl = document.querySelector('.nav__el--logout');
const userDataFormEl = document.querySelector('.form-user-data');
const userSettingsFormEl = document.querySelector('.form-user-settings');

if (loginFormEl) {
  loginFormEl.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (mapboxEl) {
  const locations = JSON.parse(mapboxEl.dataset.locations);
  displayMap(locations);
}

if (logoutBtnEl) {
  logoutBtnEl.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

if (userDataFormEl) {
  userDataFormEl.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    updateSettings({ name, email }, 'data');
  });
}

if (userSettingsFormEl) {
  userSettingsFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const savePasswordBtnEl = document.querySelector('.btn--save-password');
    savePasswordBtnEl.textContent = 'UPDATING...';

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, newPassword, confirmPassword },
      'password'
    );

    // The below code doesn't work unless updateSettings async operations is resolved
    // Once the promise is resolved in updateSettings then it is again sent as promise
    // We are awaiting for that & once resolved the below code starts to execute

    savePasswordBtnEl.textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
