import "./App.css";
import TimeSeries from "./components/timeSeries";

function App() {
  return (
    <TimeSeries
      title="PUMP01 出口温度"
      apiEndpoint="http://localhost:8900/api/stream"
      comparisonEndpoint="http://localhost:3001/api/timeseries/comparison"
      timestampField="event_time"
      valueField="value"
      queryParams={{ external_id: "PUMP01_PRESSURE" }}
    />
  );
}

export default App;
