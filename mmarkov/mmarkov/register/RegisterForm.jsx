// React component converted from your HTML
// - Preserves original layout/styles
// - External submit button linked via form="register_form"

export default function RegisterForm() {
  return (
    <>
      <style>{`
  .main-content {
    width: 50vw;
    margin-left: 25vw;
    text-align: center;
    padding: 2rem;
  }

  form input {
    width: 25%;
    padding: 4px;
    margin: 1px 5px;
    box-sizing: border-box;
    font-family: "UFCSans", sans-serif;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  form button {
    width: 10%;
    padding: 4px;
    background-color: #e7e7e7;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-family: "UFCSans", sans-serif;
    font-size: 1em;
  }

  @font-face {
    font-family: "UFCSans";
    src: url("../fonts/UFCSans-Regular.woff2") format("woff2");
  }

  @font-face {
    font-family: "UFCSans";
    src: url("../fonts/UFCSans-Bold.woff2") format("woff2");
    font-weight: bold;
  }

  body {
    font-family: "UFCSans", sans-serif;
  }

  button {
    font-family: "UFCSans", sans-serif;
    margin-top: 10px;
    font-size: 1em;
    width: 10%;
  }
      `}</style>

      <div className="main-content">
        <h2>
          Join <i>mmarkov</i>
        </h2>
        <form id="register_form">
          <label htmlFor="first_name">First name:</label>
          <br />
          <input type="text" id="first_name" name="first_name" />
          <br />

          <label htmlFor="last_name">Last name:</label>
          <br />
          <input type="text" id="last_name" name="last_name" />
          <br />

          <label htmlFor="email">Email:</label>
          <br />
          <input type="text" id="email" name="email" />
          <br />

          <label htmlFor="password">Password:</label>
          <br />
          <input type="text" id="password" name="password" />
          <br />

          <label htmlFor="confirmed_password">Confirm password:</label>
          <br />
          <input type="text" id="confirmed_password" name="confirmed_password" />
        </form>

        {/* Submit button remains outside the form, but is associated via the `form` attribute */}
        <button type="submit" form="register_form">Sign up</button>

        <p>
          By signing up, you agree to our
          {" "}
          <a href="/terms_and_conditions"> Terms &amp; Conditions</a> and
          {" "}
          <a href="/privacy"> Privacy Policy</a>.
        </p>
      </div>
    </>
  );
}
