import "./App.css";
import TimeSeries from "./components/timeSeries";

function App(params: Record<string, unknown>) {
  return <TimeSeries {...params} />;
}

export default App;
