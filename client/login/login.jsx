import { h, render } from "preact";
import { auth, onUser, provider } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

onUser((user) => {
    if (user) {
        console.log("User is signed in");
        window.location.replace("/");
        // signOut(auth);
    } else {
        console.log("User is signed out");
    }
});

const App = () => (
    <div>
        <h1>Login</h1>
        <button onClick={() => signInWithPopup(auth, provider)}>Login</button>
    </div>
);

render(<App />, document.getElementById("app"));
