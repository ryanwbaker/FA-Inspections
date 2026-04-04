import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import DeviceModal, { DeviceRecord } from "./DeviceModal";

function newDevice(): DeviceRecord {
  return {
    id: Math.random().toString(36).slice(2),
    location: "",
    deviceType: "",
    circuitAddress: "",
    fireZone: "",
    needsService: null,
    alarmConfirmed: null,
    annunciatorInd: null,
    circuitTrouble: null,
    comments: "",
  };
}

type TriStateVal = DeviceRecord["needsService"];

function StatusDot({ value }: { value: TriStateVal }) {
  const color =
    value === "pass"
      ? Colors.pass
      : value === "fail"
        ? Colors.fail
        : value === "na"
          ? Colors.na
          : Colors.border;
  return <View style={[s.dot, { backgroundColor: color }]} />;
}

export default function DeviceList() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DeviceRecord[]>([]);

  const openModal = (index: number) => {
    setDraft([...devices]);
    setActiveIndex(index);
  };

  const openNew = () => {
    const next = [...devices, newDevice()];
    setDraft(next);
    setActiveIndex(next.length - 1);
  };

  const handleUpdate = (d: DeviceRecord) => {
    setDraft((prev) => prev.map((x) => (x.id === d.id ? d : x)));
  };

  const handleSaveClose = () => {
    setDevices(draft);
    setActiveIndex(null);
  };

  const handleSaveNew = () => {
    const next = [...draft, newDevice()];
    setDraft(next);
    setDevices(next);
    setActiveIndex(next.length - 1);
  };

  const handleCancel = () => {
    setActiveIndex(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Device", "Remove this device record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setDevices((prev) => prev.filter((x) => x.id !== id)),
      },
    ]);
  };

  return (
    <View>
      {devices.length === 0 && (
        <Text style={s.empty}>
          No devices added yet. Tap below to add the first one.
        </Text>
      )}

      {devices.map((d, i) => (
        <TouchableOpacity
          key={d.id}
          style={s.row}
          onPress={() => openModal(i)}
          activeOpacity={0.7}
        >
          <View style={s.rowInner}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{d.deviceType || "?"}</Text>
            </View>
            <View style={s.summary}>
              <Text style={s.summaryTitle} numberOfLines={1}>
                {d.location || "New Device"}
              </Text>
              <Text style={s.summaryZone} numberOfLines={1}>
                {d.fireZone ? `Zone: ${d.fireZone}` : "No zone set"}
              </Text>
            </View>
            <View style={s.dots}>
              <StatusDot value={d.needsService} />
              <StatusDot value={d.alarmConfirmed} />
              <StatusDot value={d.annunciatorInd} />
              <StatusDot value={d.circuitTrouble} />
            </View>
            <Text style={s.chevron}>›</Text>
          </View>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => handleDelete(d.id)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={s.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.addBtn} onPress={openNew}>
        <Text style={s.addBtnText}>+ Add Device</Text>
      </TouchableOpacity>

      {activeIndex !== null && (
        <DeviceModal
          devices={draft}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          onSaveClose={handleSaveClose}
          onSaveNew={handleSaveNew}
          onCancel={handleCancel}
          onUpdate={handleUpdate}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  rowInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 36,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  summary: { flex: 1 },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  summaryZone: { fontSize: FontSize.sm, color: Colors.secondary, marginTop: 1 },
  dots: { flexDirection: "row", gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chevron: { fontSize: 18, color: Colors.secondary },
  deleteBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    color: Colors.fail,
    fontWeight: FontWeight.semibold,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radii.md,
    borderStyle: "dashed",
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  addBtnText: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
});
