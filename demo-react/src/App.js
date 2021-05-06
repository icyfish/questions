import logo from "./logo.svg";
import "./App.css";
import CustomCode from "./components/CustomCode";
import { codeBlock } from "./mock/data";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <CustomCode codeBlock={codeBlock} />
      </header>
    </div>
  );
}

export default App;
