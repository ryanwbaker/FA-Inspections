import { useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SignatureCanvas from "react-native-signature-canvas";
import * as ScreenOrientation from "expo-screen-orientation";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
}

const sigWebStyle = `
  * { touch-action: none; }
  .m-signature-pad { 
    box-shadow: none; 
    border: none;
    margin: 0;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
  }
  .m-signature-pad--body { 
    border: none;
    background: #FAFAF8;
    position: absolute;
    top: 0; left: 0; right: 0;
    bottom: 80px;
  }
  .m-signature-pad--footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: #FFFFFF;
    border-top: 1px solid #E0DED8;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .m-signature-pad--footer .button {
    background-color: #D4380D;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    height: 48px;
    line-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
  }
  .m-signature-pad--footer .button.clear {
    background-color: transparent;
    color: #6B6B6B;
    border: 1px solid #E0DED8;
    padding: 0 32px;
  }
  .m-signature-pad--footer .description {
    display: none;
  }
  body { 
    margin: 0; 
    background: #FAFAF8;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
`;

export default function SignatureField({ label, required }: Props) {
  const [sig, setSig] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const openModal = async () => {
    await ScreenOrientation.unlockAsync();
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    setModalVisible(true);
  };

  const closeModal = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
    setModalVisible(false);
  };

  const handleSave = async (data: string) => {
    setSig(data);
    setTimestamp(new Date().toLocaleString());
    await closeModal();
  };

  const handleClear = () => {
    setSig(null);
    setTimestamp(null);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />

      {sig ? (
        <View style={s.previewBox}>
          <Image
            source={{ uri: sig }}
            style={s.previewImage}
            resizeMode="contain"
          />
          <View style={s.previewMeta}>
            <Text style={s.timestamp}>Signed {timestamp}</Text>
            <View style={s.actions}>
              <TouchableOpacity onPress={openModal} style={s.actionBtn}>
                <Text style={s.actionText}>Redraw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClear}
                style={[s.actionBtn, s.actionBtnDanger]}
              >
                <Text style={[s.actionText, s.actionTextDanger]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.placeholder} onPress={openModal}>
          <Text style={s.placeholderText}>Tap to sign</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        supportedOrientations={[
          "landscape",
          "landscape-left",
          "landscape-right",
        ]}
      >
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={closeModal}
              style={s.modalClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Sign Here</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={s.canvasWrapper}>
            <SignatureCanvas
              onOK={handleSave}
              onEmpty={() => {}}
              descriptionText=""
              clearText="Clear"
              confirmText="Save Signature"
              webStyle={sigWebStyle}
              autoClear={false}
              imageType="image/png"
              scrollable={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  placeholder: {
    height: 80,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inputBg,
  },
  placeholderText: { fontSize: FontSize.md, color: Colors.secondary },
  previewBox: {
    borderWidth: 1,
    borderColor: Colors.pass,
    borderRadius: Radii.md,
    overflow: "hidden",
    backgroundColor: Colors.passSoft,
  },
  previewImage: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.passSoft,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timestamp: { fontSize: FontSize.sm, color: Colors.secondary, flex: 1 },
  actions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnDanger: {
    borderColor: Colors.fail,
    backgroundColor: Colors.failSoft,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  actionTextDanger: { color: Colors.fail },
  modalSafe: { flex: 1, backgroundColor: Colors.inputBg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: FontSize.xl,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  modalTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  canvasWrapper: { flex: 1 },
});
