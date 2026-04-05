import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, FontWeight, Spacing } from "../tokens";
import {
  SectionHeader,
  Divider,
  StringField,
  NumberField,
  DateField,
  BooleanYNField,
  TriStateField,
  RadioField,
  MultiCheckboxField,
  DropdownField,
  PassFailField,
  SignatureField,
  DeviceList,
} from "./index";

export default function SampleSection() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.appTitle}>FA Inspections</Text>
        <Text style={s.appSubtitle}>CAN/ULC-S536:2019</Text>

        <SectionHeader clause="22.2" title="Control Unit Functional Test" />

        {/* tri_state */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Pass / Fail / N/A Fields</Text>
          <TriStateField
            label="A — Power 'on' visual indicator operates."
            required
          />
          <Divider />
          <TriStateField
            label="B — Time and date indication corresponds with local time and date."
            required
          />
          <Divider />
          <TriStateField
            label="C — Common visual trouble signal operates."
            required
          />
        </View>

        {/* string */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Text Fields</Text>
          <StringField
            label="Field Location"
            required
            hint="Floor, room, or panel identifier"
          />
          <Divider />
          <StringField
            label="Technician's Recommendations / Testing Notes"
            multiline
          />
        </View>

        {/* number */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Numeric Fields</Text>
          <NumberField label="Auto-transfer time (seconds)" />
          <Divider />
          <NumberField label="Battery voltage — main power ON (VDC)" decimal />
        </View>

        {/* date */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Date Field</Text>
          <DateField label="Date of Service" required />
        </View>

        {/* boolean_yn */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Yes / No Fields</Text>
          <BooleanYNField
            label="System is connected to a Fire Signal Receiving Centre."
            required
          />
          <Divider />
          <BooleanYNField
            label="The fire alarm system is fully functional."
            required
          />
        </View>

        {/* radio */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Single Select (Radio)</Text>
          <RadioField
            label="System Stage"
            required
            options={["Single Stage", "Two Stage", "Other"]}
          />
        </View>

        {/* multi_checkbox */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Multi Select (Checkbox)</Text>
          <MultiCheckboxField
            label="System Technology"
            required
            options={["Addressable", "Conventional", "Wireless", "Hybrid"]}
          />
        </View>

        {/* dropdown */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Dropdown</Text>
          <DropdownField
            label="Device Type"
            required
            options={[
              "M — Manual pull station",
              "HT — Heat Detector",
              "PS — Photo-electric Smoke",
              "DS — Duct Smoke Detector",
              "FS — Sprinkler Flow Switch",
              "B — Bell",
              "H — Horn",
            ]}
          />
        </View>

        {/* pass_fail */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Pass / Fail (Circuit Fault)</Text>
          <PassFailField label="Circuit fault tolerance test result" required />
        </View>

        {/* signature */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Signature</Text>
          <SignatureField label="Primary Technician Signature" required />
        </View>

        {/* repeatable_list */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>
            Repeatable List — Device Record (§23.2)
          </Text>
          <DeviceList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  appTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardGroupLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
});
