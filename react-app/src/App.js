import "./App.css";
// import CustomCode from "./components/CustomCode";
// import { codeBlock } from "./mock/data";
import ImmerGifts from "./components/immer/gifts";

function App() {
  return (
    <div className="App">
      <div className="hidden">react-app</div>
      <ImmerGifts />
      {/* <CustomCode codeBlock={codeBlock} /> */}
    </div>
  );
}

export default App;
