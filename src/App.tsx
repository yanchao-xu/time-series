import "./App.css";
import TimeSeries from "./components/timeSeries";

function App(params: Record<string, unknown>) {
  if (!params.apiEndpoint) {
    alert("Please specify apiEndpoint");
  }
  return <TimeSeries {...params} />;
}

export default App;
