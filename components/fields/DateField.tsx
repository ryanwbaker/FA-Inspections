import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i));

function formatDate(month: number, day: number, year: string): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day + 1).padStart(2, "0");
  const yy = year.slice(2);
  return `${mm}/${dd}/${yy}`;
}

function parseToIndices(val: string): {
  month: number;
  day: number;
  year: number;
} {
  const parts = val.split("/");
  if (parts.length === 3) {
    const mm = parseInt(parts[0]) - 1;
    const dd = parseInt(parts[1]) - 1;
    const yy = parseInt("20" + parts[2]);
    const yearIdx = YEARS.indexOf(String(yy));
    if (mm >= 0 && mm < 12 && dd >= 0 && dd < 31 && yearIdx >= 0) {
      return { month: mm, day: dd, year: yearIdx };
    }
  }
  const now = new Date();
  return {
    month: now.getMonth(),
    day: now.getDate() - 1,
    year: YEARS.indexOf(String(now.getFullYear())),
  };
}

function WheelPicker({
  items,
  selectedIndex,
  onSelect,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef(selectedIndex);

  const scrollToIndex = (index: number, animated = true) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onSelect(clamped);
    }
    scrollToIndex(clamped);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onSelect(clamped);
    }
    scrollToIndex(clamped);
  };

  return (
    <View style={w.container}>
      {/* Selection highlight */}
      <View style={w.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEnd}
        onLayout={() => scrollToIndex(selectedIndex, false)}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item}
            style={w.item}
            onPress={() => {
              lastIndex.current = i;
              onSelect(i);
              scrollToIndex(i);
            }}
          >
            <Text
              style={[w.itemText, i === selectedIndex && w.itemTextSelected]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function DateField({ label, required, value, onChange }: Props) {
  const [internal, setInternal] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const val = value !== undefined ? value : internal;
  const indices = parseToIndices(val);

  const [selMonth, setSelMonth] = useState(indices.month);
  const [selDay, setSelDay] = useState(indices.day);
  const [selYear, setSelYear] = useState(Math.max(0, indices.year));

  const handleTextChange = (text: string) => {
    if (onChange) onChange(text);
    else setInternal(text);
  };

  const handleOpen = () => {
    const idx = parseToIndices(val);
    setSelMonth(idx.month);
    setSelDay(idx.day);
    setSelYear(Math.max(0, idx.year));
    setShowPicker(true);
  };

  const handleDone = () => {
    const formatted = formatDate(selMonth, selDay, YEARS[selYear]);
    if (onChange) onChange(formatted);
    else setInternal(formatted);
    setShowPicker(false);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <View style={s.row}>
        <TextInput
          style={s.input}
          value={val}
          onChangeText={handleTextChange}
          placeholder="MM/DD/YY"
          placeholderTextColor={Colors.secondary}
          keyboardType="numbers-and-punctuation"
          maxLength={8}
        />
        <TouchableOpacity style={s.calBtn} onPress={handleOpen}>
          <Text style={s.calIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            {/* Header */}
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.sheetTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={s.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Column labels */}
            <View style={s.colLabels}>
              <Text style={[s.colLabel, { flex: 2 }]}>Month</Text>
              <Text style={[s.colLabel, { flex: 1 }]}>Day</Text>
              <Text style={[s.colLabel, { flex: 1 }]}>Year</Text>
            </View>

            {/* Wheels */}
            <View style={s.wheels}>
              <View style={{ flex: 2 }}>
                <WheelPicker
                  items={MONTHS}
                  selectedIndex={selMonth}
                  onSelect={setSelMonth}
                />
              </View>
              <View style={{ flex: 1 }}>
                <WheelPicker
                  items={DAYS}
                  selectedIndex={selDay}
                  onSelect={setSelDay}
                />
              </View>
              <View style={{ flex: 1 }}>
                <WheelPicker
                  items={YEARS}
                  selectedIndex={selYear}
                  onSelect={setSelYear}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.primary,
    maxWidth: 180,
  },
  calBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  calIcon: { fontSize: 20 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  cancelText: { fontSize: FontSize.lg, color: Colors.secondary },
  doneText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  colLabels: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  colLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  wheels: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
});

const w = StyleSheet.create({
  container: { height: WHEEL_HEIGHT, overflow: "hidden" },
  highlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    left: 4,
    right: 4,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  item: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  itemText: { fontSize: FontSize.lg, color: Colors.secondary },
  itemTextSelected: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
