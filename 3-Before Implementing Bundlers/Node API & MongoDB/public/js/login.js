/* eslint-disable */

// Make request to backend regarding the authentication of the user
const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'post',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // Once user is logged in we want to display him the all tours page
    if (res.data.status === 'sucess') {
      window.setTimeout(() => {
        location.assign('/');
      }, 1500); // After 1.5s we want the user
    }
  } catch (err) {
    console.error(err.response.data);
  }
};

// On Login Form Listen For Submit Event
// Get the email & password enetered by the user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
