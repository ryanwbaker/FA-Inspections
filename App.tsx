import { SafeAreaProvider } from "react-native-safe-area-context";
import SampleSection from "./components/SampleSection";

export default function App() {
  return (
    <SafeAreaProvider>
      <SampleSection />
    </SafeAreaProvider>
  );
}
