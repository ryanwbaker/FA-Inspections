import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import type { SettingsDefaultsProps } from "../../navigation/types";
import {
  loadProfile,
  saveProfile,
  pickAndSaveLogo,
  type CompanyProfile,
  EMPTY_PROFILE,
} from "../../services/companyProfile";
import {
  loadTechProfile,
  saveTechProfile,
  type TechnicianProfile,
  EMPTY_TECH_PROFILE,
} from "../../services/techProfile";
import {
  loadLocationDefaults,
  saveLocationDefaults,
  type LocationDefaults,
  EMPTY_LOCATION_DEFAULTS,
} from "../../services/locationDefaults";
import {
  loadCustomDefaults,
  saveCustomDefaults,
  newCustomDefaultId,
  type CustomDefault,
} from "../../services/customDefaults";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  nextRef,
  onSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  nextRef?: React.RefObject<TextInput | null>;
  onSubmit?: () => void;
}) {
  return (
    <View style={sf.field}>
      <Text style={sf.label}>{label}</Text>
      <TextInput
        style={sf.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ""}
        placeholderTextColor={Colors.secondary}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        returnKeyType={onSubmit ? "done" : nextRef ? "next" : "default"}
        onSubmitEditing={onSubmit ?? (() => nextRef?.current?.focus())}
        blurOnSubmit={!nextRef}
      />
    </View>
  );
}

function FieldDivider() {
  return <View style={sf.divider} />;
}

function GroupLabel({ label }: { label: string }) {
  return (
    <View style={sf.groupLabelRow}>
      <Text style={sf.groupLabelText}>{label}</Text>
    </View>
  );
}

const sf = StyleSheet.create({
  field: { paddingVertical: Spacing.sm },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.primary,
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  groupLabelRow: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  groupLabelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DefaultsScreen({ navigation }: SettingsDefaultsProps) {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [tech, setTech] = useState<TechnicianProfile>(EMPTY_TECH_PROFILE);
  const [loc, setLoc] = useState<LocationDefaults>(EMPTY_LOCATION_DEFAULTS);
  const [customDefaults, setCustomDefaults] = useState<CustomDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickingLogo, setPickingLogo] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const addr1Ref = useRef<TextInput>(null);
  const addr2Ref = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const provinceRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);
  const certRef = useRef<TextInput>(null);
  const locCityRef = useRef<TextInput>(null);
  const locProvinceRef = useRef<TextInput>(null);

  useEffect(() => {
    Promise.all([loadProfile(), loadTechProfile(), loadLocationDefaults(), loadCustomDefaults()])
      .then(([p, t, l, c]) => {
        setProfile(p);
        setTech(t);
        setLoc(l);
        setCustomDefaults(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof CompanyProfile) => (val: string) =>
    setProfile((prev) => ({ ...prev, [key]: val }));

  const handlePickLogo = async () => {
    setPickingLogo(true);
    try {
      const uri = await pickAndSaveLogo();
      if (uri) setProfile((prev) => ({ ...prev, logoUri: uri }));
    } finally {
      setPickingLogo(false);
    }
  };

  const setTechField = (key: keyof TechnicianProfile) => (val: string) =>
    setTech((prev) => ({ ...prev, [key]: val }));

  const setLocField = (key: keyof LocationDefaults) => (val: string) =>
    setLoc((prev) => ({ ...prev, [key]: val }));

  const addCustomDefault = () =>
    setCustomDefaults(prev => [...prev, { id: newCustomDefaultId(), key: '', value: '' }]);

  const updateCustomDefault = (id: string, field: 'key' | 'value', val: string) =>
    setCustomDefaults(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));

  const removeCustomDefault = (id: string) =>
    setCustomDefaults(prev => prev.filter(d => d.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveProfile(profile),
        saveTechProfile(tech),
        saveLocationDefaults(loc),
        saveCustomDefaults(customDefaults.filter(d => d.key.trim())),
      ]);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Text style={s.sectionLabel}>Company Logo</Text>
          <TouchableOpacity
            style={s.logoCard}
            onPress={handlePickLogo}
            activeOpacity={0.7}
            disabled={pickingLogo}
          >
            {pickingLogo ? (
              <ActivityIndicator color={Colors.accent} />
            ) : profile.logoUri ? (
              <View style={s.logoPreviewWrap}>
                <Image
                  source={{ uri: profile.logoUri }}
                  style={s.logoPreview}
                  resizeMode="contain"
                />
                <Text style={s.logoHint}>Tap to change</Text>
              </View>
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>Tap to upload logo</Text>
                <Text style={s.logoHint}>PNG, JPG accepted</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Company Info */}
          <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>
            Company Info
          </Text>
          <View style={s.card}>
            <Field
              label="Company Name"
              value={profile.name}
              onChangeText={set("name")}
              nextRef={phoneRef}
            />
            <FieldDivider />
            <Field
              label="Phone"
              value={profile.phone}
              onChangeText={set("phone")}
              keyboardType="phone-pad"
              autoCapitalize="none"
              nextRef={addr1Ref}
            />
            <GroupLabel label="Location" />
            <Field
              label="Address 1"
              value={profile.address1}
              onChangeText={set("address1")}
              nextRef={addr2Ref}
            />
            <FieldDivider />
            <Field
              label="Address 2"
              value={profile.address2}
              onChangeText={set("address2")}
              placeholder="Optional"
              nextRef={cityRef}
            />
            <FieldDivider />
            <Field
              label="City"
              value={profile.city}
              onChangeText={set("city")}
              nextRef={provinceRef}
            />
            <FieldDivider />
            <Field
              label="Province / State"
              value={profile.province}
              onChangeText={set("province")}
              nextRef={postalRef}
            />
            <FieldDivider />
            <Field
              label="Postal / ZIP Code"
              value={profile.postalCode}
              onChangeText={set("postalCode")}
              autoCapitalize="none"
              nextRef={certRef}
            />
          </View>

          {/* Primary Technician */}
          <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>
            Primary Technician
          </Text>
          <View style={s.card}>
            <Field
              label="Printed Name"
              value={tech.name}
              onChangeText={setTechField("name")}
              nextRef={certRef}
            />
            <FieldDivider />
            <Field
              label="Certificate / ID Number"
              value={tech.certNumber}
              onChangeText={setTechField("certNumber")}
              autoCapitalize="none"
              nextRef={locCityRef}
            />
          </View>

          {/* Default Location */}
          <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>
            Default Location
          </Text>
          <View style={s.card}>
            <Field
              label="City"
              value={loc.city}
              onChangeText={setLocField("city")}
              nextRef={locProvinceRef}
            />
            <FieldDivider />
            <Field
              label="Province / State"
              value={loc.province}
              onChangeText={setLocField("province")}
              onSubmit={handleSave}
            />
            <FieldDivider />
            <Field
              label="Country"
              value={loc.country}
              onChangeText={setLocField("country")}
              nextRef={locCityRef}
            />
          </View>

          {/* Custom Defaults */}
          <View style={s.customHeader}>
            <Text style={s.sectionLabel}>Custom Defaults</Text>
            <TouchableOpacity onPress={addCustomDefault} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="plus-circle" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          <Text style={s.customHint}>
            Reference these in a schema field with{" "}
            <Text style={s.customHintCode}>{"source: \"custom.{key}\""}</Text>
          </Text>
          {customDefaults.length > 0 && (
            <View style={s.card}>
              {customDefaults.map((d, i) => (
                <View key={d.id} style={[s.customRow, i < customDefaults.length - 1 && s.customRowBorder]}>
                  <View style={s.customFields}>
                    <TextInput
                      style={[s.customInput, s.customKeyInput]}
                      value={d.key}
                      onChangeText={v => updateCustomDefault(d.id, 'key', v)}
                      placeholder="key"
                      placeholderTextColor={Colors.secondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      style={[s.customInput, s.customValueInput]}
                      value={d.value}
                      onChangeText={v => updateCustomDefault(d.id, 'value', v)}
                      placeholder="default value"
                      placeholderTextColor={Colors.secondary}
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeCustomDefault(d.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={16} color={Colors.fail} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {customDefaults.length === 0 && (
            <TouchableOpacity style={s.customAddBtn} onPress={addCustomDefault}>
              <Text style={s.customAddBtnText}>+ Add Custom Default</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
    minHeight: 56,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 64,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: "#FFF",
  },

  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // Logo
  logoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  logoPreviewWrap: { alignItems: "center", gap: Spacing.sm },
  logoPreview: { width: 200, height: 80 },
  logoPlaceholder: { alignItems: "center", gap: Spacing.xs },
  logoPlaceholderText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  logoHint: { fontSize: FontSize.sm, color: Colors.secondary },

  // Fields card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  // Custom defaults
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  customHint: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  customHintCode: {
    fontFamily: 'Courier',
    color: Colors.accent,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  customRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  customFields: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
  customInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  customKeyInput: { flex: 2 },
  customValueInput: { flex: 3 },
  customAddBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  customAddBtnText: { fontSize: FontSize.md, color: Colors.secondary },
});
