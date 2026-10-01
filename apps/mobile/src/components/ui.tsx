import { type ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type KeyboardTypeOptions, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const palette = { background: "#F5F5F7", surface: "#FFFFFF", text: "#1D1D1F", muted: "#6E6E73",
  blue: "#0071E3", blueSoft: "#EAF3FF", border: "#E5E5EA", red: "#C73636", green: "#23824A" };

export function Screen({ children, title, subtitle, scroll = true }: { children: ReactNode; title?: string; subtitle?: string; scroll?: boolean }) {
  const content = <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 }}>
    <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:20}}><Image source={require("../../assets/images/icon.png")} accessibilityLabel="KaçaYapayım logosu" style={{width:40,height:40}} resizeMode="contain"/><Text style={{fontSize:20,fontWeight:"700",letterSpacing:-0.7,color:palette.text}}>KaçaYapayım</Text></View>
    {Boolean(title) && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
    {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
    {children}
  </View>;
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palette.background }}>
    {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content}
  </SafeAreaView>;
}
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Button({ title, onPress, disabled, quiet, danger }: { title: string; onPress: () => void;
  disabled?: boolean; quiet?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.button, quiet && styles.quietButton, danger && styles.dangerButton,
      (disabled || pressed) && { opacity: 0.58 }]}>
    <Text style={[styles.buttonText, quiet && { color: palette.blue }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, secureTextEntry,
  autoCapitalize, textContentType }: { label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: KeyboardTypeOptions; multiline?: boolean; secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"]; textContentType?: TextInputProps["textContentType"] }) {
  return <View style={{ marginBottom: 17 }}><Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#96969B" keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize} textContentType={textContentType}
      style={[styles.input, multiline && { minHeight: 96, textAlignVertical: "top", paddingTop: 14 }]} />
  </View>;
}
export function Choice({ title, selected, onPress, detail }: { title: string; selected: boolean; onPress: () => void; detail?: string }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}
    style={[styles.choice, selected && { borderColor: palette.blue, backgroundColor: palette.blueSoft }]}>
    <View style={{ flex: 1 }}><Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>{title}</Text>
      {Boolean(detail) && <Text style={{ color: palette.muted, marginTop: 3 }}>{detail}</Text>}</View>
    <Text style={{ color: selected ? palette.blue : palette.border, fontSize: 20 }}>{selected ? "●" : "○"}</Text>
  </Pressable>;
}
export function Row({ title, subtitle, right, onPress }: { title: string; subtitle?: string; right?: string; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? "button" : undefined} onPress={onPress} disabled={!onPress}
    style={styles.row}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{title}</Text>
      {Boolean(subtitle) && <Text style={styles.rowSubtitle}>{subtitle}</Text>}</View>
      {Boolean(right) && <Text style={styles.rowRight}>{right}</Text>}{onPress && <Text style={{ color: palette.muted }}> ›</Text>}</Pressable>;
}
export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={styles.sectionTitle}>{children}</Text>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <View style={[styles.notice, error && { backgroundColor: "#FFF0EF" }]}>
    <Text style={{ color: error ? palette.red : palette.muted, lineHeight: 21 }}>{children}</Text></View>;
}
export function Loading() { return <Screen><ActivityIndicator color={palette.blue} style={{ marginTop: 80 }} /></Screen>; }
export function Empty({ title, detail }: { title: string; detail: string }) {
  return <Card style={{ marginTop: 18, paddingVertical: 32 }}><Text style={{ fontSize: 18, fontWeight: "600", color: palette.text }}>{title}</Text>
    <Text style={{ color: palette.muted, lineHeight: 21, marginTop: 8 }}>{detail}</Text></Card>;
}
export const styles = StyleSheet.create({
  title: { color: palette.text, fontSize: 32, fontWeight: "700", letterSpacing: -1.2 },
  subtitle: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 7, marginBottom: 20 },
  card: { backgroundColor: palette.surface, borderRadius: 20, padding: 18, marginTop: 12,
    borderWidth: 1, borderColor: "#EEEEF0" },
  button: { backgroundColor: palette.blue, minHeight: 50, borderRadius: 13, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 16, marginTop: 12 },
  quietButton: { backgroundColor: palette.blueSoft }, dangerButton: { backgroundColor: palette.red },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  label: { color: palette.text, fontWeight: "600", marginBottom: 7, fontSize: 14 },
  input: { backgroundColor: "white", minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: 14, color: palette.text, fontSize: 16 },
  choice: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 15,
    borderWidth: 1, borderColor: palette.border, borderRadius: 13, backgroundColor: "white", marginBottom: 9 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 63, borderBottomWidth: 1,
    borderColor: palette.border, gap: 7, paddingVertical: 9 },
  rowTitle: { color: palette.text, fontSize: 15, fontWeight: "600" },
  rowSubtitle: { color: palette.muted, fontSize: 13, marginTop: 4 },
  rowRight: { color: palette.muted, fontSize: 13 },
  sectionTitle: { color: palette.text, fontSize: 19, fontWeight: "600", marginTop: 24, marginBottom: 5 },
  notice: { backgroundColor: "#ECECF0", borderRadius: 12, padding: 13, marginTop: 14 },
});
