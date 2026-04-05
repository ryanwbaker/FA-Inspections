import { SafeAreaProvider } from "react-native-safe-area-context";
import SampleSection2 from "./components/SampleSection2";

export default function App() {
  return (
    <SafeAreaProvider>
      <SampleSection2 />
    </SafeAreaProvider>
  );
}
